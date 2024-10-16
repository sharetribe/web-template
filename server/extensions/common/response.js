const { serialize, deserialize } = require('./sdk');

const finalizeTransitResponse = (res) => async (result) => {
  const { status = 200, data, meta, statusText } = result;
  return res
    .status(status)
    .set('Content-Type', 'application/transit+json')
    .send(
      serialize({
        status,
        statusText,
        data,
        meta,
      })
    )
    .end();
};

const finalizeResponse = (res) => async (result) => {
  const { status = 200, data, meta, statusText } = result;
  return res
    .status(status)
    .send({
      status,
      statusText,
      data,
      meta,
    })
    .end();
};

const handleResponse = (res) => {
  const contentTypeHeader = res.headers['content-type'];
  const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;

  if (res.status >= 400) {
    let e = new Error();
    e = Object.assign(e, res.data);

    throw e;
  }

  if (contentType === 'application/transit+json') {
    return deserialize(JSON.stringify(res.data));
  }
  return res.data;
};

module.exports = { finalizeTransitResponse, finalizeResponse, handleResponse };
