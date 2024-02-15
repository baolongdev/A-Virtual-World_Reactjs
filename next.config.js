

module.exports = {
  async redirects() {
    return [
      {
        source: '/model',
        destination: '/model/create',
        permanent: true,
      },
    ]
  },
}
