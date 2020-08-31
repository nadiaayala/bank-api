import express from 'express';
import {accountRouter} from './routes/accountRouter.js';

const app = express();

app.use(express.json());

app.use(accountRouter);

app.listen(3000 , () => console.log('API STARTED'));