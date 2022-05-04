const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function verrifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized acces' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'acess forbidden' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })

    // console.log('inside verify jwt', authHeader);

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kvekh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {

        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');
        const orderCollection = client.db('geniusCar').collection('order');


        // Auth 

        app.post('/login', async (req, res) => {
            const user = req.body;
            // console.log(req.body)
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            // console.log(accessToken)
            res.send({ accessToken });
        })

        // load all services

        app.get('/service', async (req, res) => {

            const query = {};

            const cursor = serviceCollection.find(query);

            const services = await cursor.toArray();

            res.send(services);
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })

        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result)
        })

        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result)
        })

        app.put('/service/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: updatedUser
            };

            const result = await serviceCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // app.get('/order', async (req, res) => {
        //     const query = {};
        //     const cursor = orderCollection.find(query);
        //     const result = await cursor.toArray();
        //     res.send(result)
        // })

        app.get('/order', verrifyJWT, async (req, res) => {
            // const query=req.query;
            // console.log(query)
            const decodedEmail = req.decoded.emailInput;

            const email = req.query.email;
            console.log(email);
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
            // const query = { email: email };
            // const cursor = orderCollection.find(query);
            // const orders = await cursor.toArray();
            // res.send(orders);
        })
    }

    finally {

    }
}
app.get('/', (req, res) => {
    res.send("responding genius car site from server");
});


app.listen(port, () => {
    console.log('listening to port',port);
});

run().catch(console.dir);