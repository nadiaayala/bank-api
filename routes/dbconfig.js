import mongoose from 'mongoose';
import express from 'express';

//Connecting API to MongoDB
const start = (async function(){
    try{
        await mongoose.connect('mongodb+srv://nadiaayala:bootcampigtifullstack@cluster0.berfc.mongodb.net/bank?retryWrites=true&w=majority',
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('Sucsessfully connected to MongoDB.');
    }
    catch(err){
        console.log('Error while connecting to MongoDB: ' + err); 
    }
});

export default start;

