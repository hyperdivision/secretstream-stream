const streamx = require('streamx')
const stream = require('./stream')
const secret = require('./')
const pump = require('pump')

const keys = {}
keys.rx = Buffer.alloc(32, 1)
keys.tx = Buffer.alloc(32, 2)

const header = Buffer.alloc(secret.HEADERBYTES)
secret.encrypt(header, keys.rx)

const st = new streamx.Readable()
const out = new streamx.Duplex({
  write (data, cb) {
    console.log('final', data.toString())
    cb()
  }
})

const enc = new stream.SecretstreamPush(keys.tx)
const dec = new stream.SecretstreamPull(keys.tx)

process.stdin.pipe(enc)
dec.pipe(process.stdout)

enc.pipe(dec)

st.push(Buffer.from('testing1'))
st.push(Buffer.from('testing2'))
st.push(Buffer.from('testing3'))

function noop () {}
