const server = require('./src/server.js')({})
const axios = require("axios");

async function recreate(connectUri, stackId, imageUri) {
  const [username, password, host] = connectUri.split('@');
  axios.defaults.baseURL = host;
  axios.defaults.headers.post['Content-Type'] = 'application/json';
  const auth = await axios.post('/auth', { username, password })
  // console.log(auth.data)
  axios.defaults.headers.common.Authorization = `Bearer ${auth.data.jwt}`;

  const registries = await axios.get(`/endpoints/${stackId}/registries`)
  const ghRegistry = registries.data.find((reg) => reg.URL.includes('ghcr.io'))
  const listContainers = await axios.get(`/endpoints/${stackId}/docker/containers/json?all=1`)
  // console.log(listContainers.data)
  const selected = listContainers.data.find((container) => imageUri.includes(container.Image));
  const containerName = selected.Names[0].slice(1);
  // console.log(containerName)
  const tokenData = {
    registryId: ghRegistry.Id
  }
  const ghToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  // console.log('ghToken', ghRegistry, ghToken)
  const create = await axios.post(`/endpoints/${stackId}/docker/images/create?fromImage=${encodeURIComponent(imageUri)}`, {}, {
    headers: {
      'x-registry-auth': ghToken
    }
  })
  // console.log('create', create.data)
  if (selected.State === 'running') {
    const stop = await axios.post(`/endpoints/${stackId}/docker/containers/${selected.Id}/stop`)
    console.log('stop', stop.data)
  }
  const rename = await axios.post(`/endpoints/${stackId}/docker/containers/${selected.Id}/rename?name=${containerName}-old`)
  console.log('rename', rename.data)
  const container = await axios.post(`/endpoints/${stackId}/docker/containers/create?name=${containerName}`, selected)
  console.log('container', container.data)
  try {
    const connect = await axios.post(`/endpoints/${stackId}/docker/networks/${Object.keys(selected.NetworkSettings.Networks)[0]}/connect`)
    console.log('connect', connect.data)
  } catch (error) {
    console.log('error', error.message)
  }
  const start = await axios.post(`/endpoints/${stackId}/docker/containers/${container.data.Id}/start`)
  console.log('start', start.data)
  const control = await axios.put(`/resource_controls/${container.data.Portainer.ResourceControl.Id}`, { "AdministratorsOnly": true, Public: false })
  console.log('control', control.data)
  const deleteContainer = await axios.delete(`/endpoints/${stackId}/docker/containers/${selected.Id}?force=true&v=1`)
  console.log('deleteContainer', deleteContainer.data)
}

const serverFactory = (handler, opts) => {
  server.on('request', handler)
  return server;
}

const fastify = require("fastify");
const app = fastify({
  logger: true,
  // serverFactory
});

app.post('/', (req, reply) => {
  const { connectUri, stackId, imageUri } = req.body;
  recreate(connectUri, stackId, imageUri);
  reply.status(200).send('OK');
})

app.get('/', (req, reply) => {
  reply.status(200).send('Test OK\n');
})

app.ready().then(() => {
  app.listen(process.env.PORT || 3000, '0.0.0.0', (sock) => { // Note: you cannot do server.listen, as Fastify apparently needs to set some things
    if (sock) console.log('listening')
  })
})
