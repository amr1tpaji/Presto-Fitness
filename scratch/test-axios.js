const axios = require('axios');
const FormData = require('form-data');

const form = new FormData();
form.append('test', '123');

axios.interceptors.request.use(config => {
  console.log(config.headers);
  return config;
});

axios.post('http://localhost:5000', form, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).catch(() => {});
