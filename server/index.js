const express = require('express')
const cors = require('cors')
require('dotenv').config()
const connectDB = require('./config/connectDB')
const router = require('./routes/index')
const cookiesParser = require('cookie-parser')
const { app, server } = require('./socket/index')

// const app = express()
app.use(cors({
        origin: fetch('https://proxy.cors.sh/https://bit-buzz-client.vercel.app', {
  headers: {
  'x-cors-api-key': 'temp_5ff5db0f59d066b04b80c33caf6c3f04'
  }
}),
        methods: ["POST", "GET"],
        credentials: true
}))
app.use(express.json())
app.use(cookiesParser())

const PORT = process.env.PORT || 8080

app.get('/',(request,response)=>{
    response.json({
        message : "Server running at " + PORT
    })
})

//api endpoints
app.use('/api',router)

connectDB().then(()=>{
    server.listen(PORT,()=>{
        console.log("server running at " + PORT)
    })
})
