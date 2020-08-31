import express from 'express';
import {accountModel} from '../models/accountModel.js';
import mongoose from 'mongoose';
import start from './dbconfig.js'


// Connecting API to MongoDB
// (async () => {
//     try{
//         await mongoose.connect('mongodb+srv://nadiaayala:24121997us@cluster0.berfc.mongodb.net/bank?retryWrites=true&w=majority',
//         {
//           useNewUrlParser: true,
//           useUnifiedTopology: true,
//         });
//         console.log('Sucsessfully connected to MongoDB.');
//     }
//     catch(err){
//         console.log('Error while connecting to MongoDB: ' + err); 
//     }
// })();

start();

const app = express();

//Criação de uma nova conta
app.post('/accounts', async (req, res ) => {
    try{
        const account = new accountModel(req.body);
        await account.save();
        res.send(account);
        
    }
    catch(err){
        res.status(500).send(err);
    }
});

//4. Deposito em conta
app.patch('/accounts', async (req, res, next) => {
    try {
        let { agencia, conta, deposito } = req.body;
        deposito = parseInt(deposito);
        const updatedAccount = await accountModel.findOneAndUpdate({conta, agencia}, {$inc: {balance: deposito}}, {new: true});
        console.log(updatedAccount);
        res.send(updatedAccount);
    }
    catch(err){
        next(err);
    }
});

//5. Saque da conta
app.patch('/accounts/saque', async (req, res) => {
    let {agencia, conta, saque} = req.body;
    let account = await accountModel.findOne({conta, agencia});

    if(!account){
        res.status(404).send(`Account doesn't exist.`);
        return;
    }
    if(account.balance < saque){
        res.status(404).send(`Balance is not enough.`);
        return;
    }

    const updatedAccount = await accountModel.findOneAndUpdate({conta, agencia}, {$inc: {balance: saque * -1}},  {new: true});
    res.send(`Conta ${updatedAccount.conta} | Agência: ${updatedAccount.agencia} | Novo saldo: R$ ${updatedAccount.balance}`);
});
 

//6. Consultar o saldo da conta
app.get('/accounts/checkBalance', async (req, res, next) => {
    try{
        const conta = parseInt(req.query.conta);
        const agencia = parseInt(req.query.agencia);
    
        const account = await accountModel.findOne({ $and: [{conta: conta}, {agencia: agencia}]});
        if(!account){
            throw new Error(`Account doesn't exist.`);
        }
        res.send(`Conta ${account.conta} | Agencia ${account.agencia} | Saldo: R$ ${account.balance}`);
    }
    catch(err){
        next(err);
    }
});


//7. Excluir uma conta 
app.delete('/accounts', async (req, res, next) => {
    try {
        const { conta, agencia } = req.body;
        const account = await accountModel.findOneAndDelete({$and: [{conta: conta}, {agencia: agencia}]});
        if (!account) {
            throw new Error(`Account doesn't exist.`);
        }
        const accountsInAgency = await accountModel.find({agencia: agencia}).countDocuments();
        res.send(`Account ${account.conta} has been deleted. There are ${accountsInAgency} accounts left in this agency.`);
    }
    catch (err) {
        next(err);
    }
});


//8. Transferência entre contas
app.patch('/accounts/transfer', async (req, res, next) => {
    try {
        const { contaOrigem, contaDestino, valor } = req.body;
        let accountFrom = await accountModel.findOne({ conta: contaOrigem });
        let accountTo = await accountModel.findOne({ conta: contaDestino });

        if (!accountFrom) {
            throw new Error(`Sender's account does not exist.`);
        }
        if (!accountTo) {
            throw new Error(`Receiver's account does not exist.`);
        }

        const valorFinal = accountFrom.agencia === accountTo.agencia ? (valor) : (valor + 8);

        accountFrom = await accountModel.findOneAndUpdate({ conta: accountFrom.conta },
             { $inc: { balance: valorFinal * -1 } }, { new: true });
        accountTo = await accountModel.findOneAndUpdate({ conta: accountTo.conta }, 
            { $inc: { balance: valorFinal } }, { new: true });

        res.send(`Operation is done. New balance in sender's account: ${accountFrom.balance}`);
    }
    catch (err) {
        next(err);
    }
});


//9. 9. Crie um endpoint para consultar a média do saldo dos clientes de determinada
// agência. O endpoint deverá receber como parametro a “agência” e deverá retornar
// o balance médio da conta.

app.get('/agencias', async (req, res, next) => {
    try {
        const agencia = parseInt(req.query.agencia);
        const averageBalance = await accountModel.aggregate([
          {
            $match: {
              agencia,
            },
          },
          {
            $group: {
              _id: "$agencia",
              media: {
                $avg: "$balance",
              },
            },
          },
        ]);
        res.send(averageBalance);

    } catch (error) {
        next(error);
      }
    });


// 10. Consultar os clientes com o menor saldo em conta.
app.get('/accounts/poorest', async (req, res) => {
    const quantity = parseInt(req.query.quantity);
    const accounts = await accountModel.find().sort({balance: 1}).limit(quantity);
    res.send(accounts);
});


// 11. Crie um endpoint para consultar os clientes mais ricos do banco. 
app.get('/accounts/richest/', async (req, res) => {
    const quantity = parseInt(req.query.quantity);
    const accounts = await accountModel.find().sort({balance: -1}).limit(quantity);
    res.send(accounts);
});



// 12. Transferir o cliente com maior saldo em conta de cada agência para a agência private agencia=99. 
app.get("/accounts/transferToPrivate/", async (req, res, next) => {
    try{
        const transferToPrivates = await accountModel.aggregate([
            {
              $group: {
                _id: "$agencia",
                highest: {
                  $max: "$balance",
                },
              },
            },
        ]);

        for (const transferToPrivate of transferToPrivates) {
            const { _id, highest } = transferToPrivate;
            let newAccount = await accountModel.findOne({agencia: _id}, {balance: highest});
            newAccount.agencia = 99;
            newAccount.save();
            
        }
        const accounts = await accountModel.find({agencia: 99}, {_id: 0}); 
        res.send(accounts);
    }
    catch(err){
        next(err);
    }
});  

// Error treatment function
app.use((err, req, res, next) => {
    console.log(err);
    res.status(400).send({ error: err.message });
  });

export {app as accountRouter};