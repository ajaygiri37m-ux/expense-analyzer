const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

const db = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10
});

/* ======================
   HELPER
====================== */
function handleError(res, err){
  console.error(err);
  res.status(500).json({error:"Database error"});
}

/* ======================
   EXPENSE ROUTES
====================== */

app.get('/expenses',(req,res)=>{

  let sql='SELECT * FROM expenses ORDER BY expense_date DESC';
  const params=[];

  if(req.query.from && req.query.to){
    sql='SELECT * FROM expenses WHERE expense_date BETWEEN ? AND ? ORDER BY expense_date DESC';
    params.push(req.query.from,req.query.to);
  }

  db.query(sql,params,(err,result)=>{
    if(err) return handleError(res,err);
    res.json(result);
  });

});

app.post('/expenses',(req,res)=>{

  const {category,amount,expense_date,description}=req.body;

  if(!category || !amount || !expense_date)
    return res.status(400).json({error:"Missing fields"});

  db.query(
    'INSERT INTO expenses(category,amount,expense_date,description) VALUES(?,?,?,?)',
    [category,amount,expense_date,description],
    (err,r)=>{
      if(err) return handleError(res,err);
      res.json({message:"Expense added",id:r.insertId});
    });

});

app.put('/expenses/:id',(req,res)=>{

  const {category,amount,expense_date,description}=req.body;

  db.query(
    'UPDATE expenses SET category=?,amount=?,expense_date=?,description=? WHERE id=?',
    [category,amount,expense_date,description,req.params.id],
    err=>{
      if(err) return handleError(res,err);
      res.json({message:"Updated"});
    });

});

app.delete('/expenses/:id',(req,res)=>{
  db.query('DELETE FROM expenses WHERE id=?',[req.params.id],
    err=>{
      if(err) return handleError(res,err);
      res.json({message:"Deleted"});
    });
});

/* ======================
   INCOME ROUTES
====================== */

app.get('/income',(req,res)=>{

  let sql='SELECT * FROM income ORDER BY income_date DESC';
  const params=[];

  if(req.query.from && req.query.to){
    sql='SELECT * FROM income WHERE income_date BETWEEN ? AND ? ORDER BY income_date DESC';
    params.push(req.query.from,req.query.to);
  }

  db.query(sql,params,(err,result)=>{
    if(err) return handleError(res,err);
    res.json(result);
  });

});

app.post('/income',(req,res)=>{

  const {source,amount,income_date,description}=req.body;

  if(!source || !amount || !income_date)
    return res.status(400).json({error:"Missing fields"});

  db.query(
    'INSERT INTO income(source,amount,income_date,description) VALUES(?,?,?,?)',
    [source,amount,income_date,description],
    (err,r)=>{
      if(err) return handleError(res,err);
      res.json({message:"Income added",id:r.insertId});
    });

});

app.put('/income/:id',(req,res)=>{

  const {source,amount,income_date,description}=req.body;

  db.query(
    'UPDATE income SET source=?,amount=?,income_date=?,description=? WHERE id=?',
    [source,amount,income_date,description,req.params.id],
    err=>{
      if(err) return handleError(res,err);
      res.json({message:"Updated"});
    });

});

app.delete('/income/:id',(req,res)=>{
  db.query('DELETE FROM income WHERE id=?',[req.params.id],
    err=>{
      if(err) return handleError(res,err);
      res.json({message:"Deleted"});
    });
});

/* ======================
   BALANCE
====================== */

app.get('/balance',(req,res)=>{

  const sql=`
    SELECT
      (SELECT IFNULL(SUM(amount),0) FROM income) AS totalIncome,
      (SELECT IFNULL(SUM(amount),0) FROM expenses) AS totalExpenses
  `;

  db.query(sql,(err,r)=>{
    if(err) return handleError(res,err);

    const totalIncome=r[0].totalIncome;
    const totalExpenses=r[0].totalExpenses;

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome-totalExpenses
    });
  });

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));