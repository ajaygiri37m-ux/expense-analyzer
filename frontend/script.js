/* ================= CONFIG ================= */
const API="";

/* ================= SIDEBAR ================= */
function openSidebar(){ document.getElementById("sidebar").style.width="200px"; }
function closeSidebar(){ document.getElementById("sidebar").style.width="0"; }

function showSection(s){

document.getElementById("dashboard").style.display=s==="dashboard"?"block":"none";
document.getElementById("tracker").style.display=s==="tracker"?"block":"none";
document.getElementById("analytics").style.display=s==="analytics"?"block":"none";

closeSidebar();

if(s==="analytics") setTimeout(loadAnalytics,200);
}

/* ================= POPUP ================= */
function popup(msg){
const p=document.getElementById("popup");
p.textContent=msg;
p.style.display="block";
setTimeout(()=>p.style.display="none",2000);
}

/* ================= EXPENSES ================= */
async function loadExpenses(){

const res=await fetch(API+"/expenses");
const data=await res.json();

const list=document.getElementById("expense-list");
list.innerHTML="";

data.forEach(e=>{

const d=new Date(e.expense_date).toLocaleDateString("en-IN");

const li=document.createElement("li");

li.innerHTML=`
<span>${e.category} ₹${e.amount} (${d})</span>
<span>
<button class="delete-btn">Delete</button>
<button class="edit-btn">Edit</button>
</span>`;

li.querySelector(".delete-btn").onclick=async()=>{
if(!confirm("Delete?")) return;
await fetch(API+"/expenses/"+e.id,{method:"DELETE"});
loadExpenses();loadBalance();popup("Deleted");
};

li.querySelector(".edit-btn").onclick=async()=>{

const category=prompt("Category",e.category);
const amount=prompt("Amount",e.amount);
const date=prompt("Date YYYY-MM-DD",e.expense_date.split("T")[0]);
const description=prompt("Note",e.description||"");

await fetch(API+"/expenses/"+e.id,{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({category,amount,expense_date:date,description})
});

loadExpenses();loadBalance();popup("Updated");
};

list.appendChild(li);

});
}

/* ADD EXPENSE */
document.getElementById("expense-form").onsubmit=async e=>{
e.preventDefault();

await fetch(API+"/expenses",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
category:category.value,
amount:amount.value,
expense_date:date.value,
description:note.value
})
});

e.target.reset();
loadExpenses();loadBalance();popup("Expense added");
};

/* ================= INCOME ================= */

async function loadIncome(){

const res=await fetch(API+"/income");
const data=await res.json();

const list=document.getElementById("income-list");
list.innerHTML="";

data.forEach(i=>{

const d=new Date(i.income_date).toLocaleDateString("en-IN");

const li=document.createElement("li");

li.innerHTML=`
<span>${i.source} ₹${i.amount} (${d})</span>
<span>
<button class="delete-btn">Delete</button>
<button class="edit-btn">Edit</button>
</span>`;

li.querySelector(".delete-btn").onclick=async()=>{
if(!confirm("Delete?")) return;
await fetch(API+"/income/"+i.id,{method:"DELETE"});
loadIncome();loadBalance();popup("Deleted");
};

li.querySelector(".edit-btn").onclick=async()=>{

const source=prompt("Source",i.source);
const amount=prompt("Amount",i.amount);
const date=prompt("Date YYYY-MM-DD",i.income_date.split("T")[0]);
const description=prompt("Note",i.description||"");

await fetch(API+"/income/"+i.id,{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({source,amount,income_date:date,description})
});

loadIncome();loadBalance();popup("Updated");
};

list.appendChild(li);

});
}

/* ADD INCOME */
document.getElementById("income-form").onsubmit=async e=>{
e.preventDefault();

await fetch(API+"/income",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
source:source.value,
amount:document.getElementById("income-amount").value,
income_date:document.getElementById("income-date").value,
description:document.getElementById("income-note").value
})
});

e.target.reset();
loadIncome();loadBalance();popup("Income added");
};

/* ================= BALANCE ================= */

async function loadBalance(){

const res=await fetch(API+"/balance");
const d=await res.json();

document.getElementById("income-total").textContent="Income ₹"+d.totalIncome;
document.getElementById("expense-total").textContent="Expenses ₹"+d.totalExpenses;
document.getElementById("balance-total").textContent="Balance ₹"+d.balance;
}

/* ================= CHARTS ================= */

let barChart,pieChart,trendChart,histogramChart;

async function loadAnalytics(){

const filter=document.getElementById("filter").value;

const [expenses,income]=await Promise.all([
fetch(API+"/expenses").then(r=>r.json()),
fetch(API+"/income").then(r=>r.json())
]);

/* BAR */

const totalIncome=income.reduce((s,x)=>s+Number(x.amount),0);
const totalExpense=expenses.reduce((s,x)=>s+Number(x.amount),0);

barChart?.destroy();
barChart=new Chart(document.getElementById("incomeExpenseChart"),{
type:"bar",
data:{
labels:["Income","Expenses"],
datasets:[{
label:"Amount",
data:[totalIncome,totalExpense],
backgroundColor:["#2ecc71","#e74c3c"],
borderRadius:8
}]
},
options:{plugins:{legend:{display:false}},animation:false,maintainAspectRatio:false}
});

/* DOUGHNUT */

const cats={};
expenses.forEach(x=>cats[x.category]=(cats[x.category]||0)+Number(x.amount));

pieChart?.destroy();
pieChart=new Chart(document.getElementById("expenseCategoryChart"),{
type:"doughnut",
data:{labels:Object.keys(cats),datasets:[{data:Object.values(cats)}]},
options:{animation:false,maintainAspectRatio:false}
});

/* LINE (FILTER ONLY HERE) */

function group(arr,field){
const g={};
arr.forEach(x=>{
const d=new Date(x[field]);
let key;
if(filter==="yearly") key=d.getFullYear();
else if(filter==="weekly") key="W"+Math.ceil(d.getDate()/7)+"-"+(d.getMonth()+1);
else key=d.getFullYear()+"-"+(d.getMonth()+1);
g[key]=(g[key]||0)+Number(x.amount);
});
return g;
}

const eG=group(expenses,"expense_date");
const iG=group(income,"income_date");
const labels=[...new Set([...Object.keys(eG),...Object.keys(iG)])].sort();

trendChart?.destroy();
trendChart=new Chart(document.getElementById("trendChart"),{
type:"line",
data:{
labels,
datasets:[
{label:"Expenses",data:labels.map(l=>eG[l]||0),borderColor:"#e74c3c",tension:.35},
{label:"Income",data:labels.map(l=>iG[l]||0),borderColor:"#2ecc71",tension:.35}
]
},
options:{animation:false,maintainAspectRatio:false}
});

/* HISTOGRAM */

const bins=[0,500,1000,2000,5000,10000];
const labelsH=["<500","500-1k","1k-2k","2k-5k","5k-10k",">10k"];

const freq=bins.map((b,i)=>{
if(i===bins.length-1) return expenses.filter(e=>Number(e.amount)>=b).length;
return expenses.filter(e=>Number(e.amount)>=b && Number(e.amount)<bins[i+1]).length;
});

histogramChart?.destroy();

histogramChart = new Chart(document.getElementById("expenseHistogram"), {
  type: "bar",
  data: {
    labels: labelsH,          // make sure labelsH exists
    datasets: [{
      label: "Transactions",
      data: freq,
      backgroundColor: "#9b59b6"
    }]
  },
  options: {
    animation: false,
    maintainAspectRatio: false,
    plugins:{
      legend:{display:false}   // hides legend so no "undefined"
    }
  }
});

}

/* FILTER CHANGE */
document.getElementById("filter").onchange=loadAnalytics;

/* INIT */
window.onload=()=>{
loadExpenses();
loadIncome();
loadBalance();
};