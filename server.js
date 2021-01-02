const express = require('express')
const request = require('request')
const mongodb = require('mongodb')
const exphbs = require('express-handlebars')
var fs = require('fs');
const path = './token.json';

const app = express();

const oauthDetails = {
    client_id: 'oauth2client_0000A2fX0LHstmlC7ItnDF',
    client_secret: 'mnzpub.Elqcd/NpqJFx+cBGGbMoAzRc2KIV/rTcYd1FVLg4fKK34prBF3DJQBUfg8tWoNMQf+pUWvhQbLESYo2swsvILQ==',
    redirect_uri: 'http://localhost:5000/oauth/callback'
  };

let accessToken = null;
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))

let db;

const PORT = process.env.PORT || 5000;

// Connect to database before the website works
let connectionstring = 'mongodb+srv://aus123:aus123@cluster0.hflbh.mongodb.net/grocery?retryWrites=true&w=majority'

// let client = new mongodb(connectionstring)

mongodb.connect(connectionstring, { useUnifiedTopology: true.valueOf},(err, client) => {
    console.log(client.db().databaseName)
    db = client.db();
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})

// Set Handlebars
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Set Handlebars route
app.get('/', function (req, res) {
    res.render('home')
});

// For shopping list
app.get('/shopping_list', function(req, res){
    db.collection('items').find({checked: false}).toArray((err, items) =>{
        items = JSON.stringify(items)
        console.log(items);
    res.render('shopping_list', {stuff: items})
})
})

app.post('/create-item', (req, res) =>{
    console.log(req.body.name);
    db.collection('items').insertOne({name: req.body.name, checked: false}, function(err, info){
        // res.redirect('/shopping_list');
    res.json(info.ops[0])
    } )
    
})

app.post('/update-item', (req, res) =>{
    db.collection('items').findOneAndUpdate({_id: new mongodb.ObjectId(req.body.id)},{$set: {name: req.body.name}}, () =>{
        res.send("Success")
    })
})

app.post('/delete-item', (req, res)=>{
    db.collection('items').findOneAndUpdate({_id: new mongodb.ObjectId(req.body.id)}, {$set: {checked: true}},function(){
        res.send("Success")
    })
})

// Create split_bill route
app.get('/split_bills', (req, res) => {
    const { client_id, redirect_uri } = oauthDetails;
    const monzoAuthUrl = 'https://auth.monzo.com';
    try{
    accessToken = JSON.parse(fs.readFileSync(path,{encoding:'utf8'}));
    }
    catch (err){
      res.redirect(monzoAuthUrl + "?client_id=" + client_id + "&redirect_uri=" + redirect_uri + "&response_type=code");
    }
    const {token_type, access_token} = accessToken;
    const ping = 'https://api.monzo.com/ping/whoami';
    // change to more efficient way
    request.get(ping,{
        headers: {
            Authorization: `${token_type} ${access_token}`
        }
    }, (req, response, body) => {
        const {authenticated} = JSON.parse(body);
        console.log(authenticated);
        if(!authenticated){
            res.redirect(monzoAuthUrl + "?client_id=" + client_id + "&redirect_uri=" + redirect_uri + "&response_type=code");
        }
        else{
            res.type('html');
            res.redirect('/accounts');
        }
        
    })
});


app.get('/oauth/callback', (req, res) => {
    const { client_id, client_secret, redirect_uri } = oauthDetails;
    const { code } = req.query;
    const monzoAuthUrl = `https://api.monzo.com/oauth2/token`;

    // Initiate request to retrieve access token
    request.post({
      url: monzoAuthUrl,
      form: {
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        redirect_uri,
        code
      } 
    }, (err, response, body) => {
      if(err){
          throw err;
      }
      accessToken = JSON.parse(body); // Populate accessToken variable with token response
      console.log(accessToken);
      fs.writeFile(path,JSON.stringify(accessToken),'utf8',(err) =>{
        if(err){
          console.log(err);
        }
      });
      res.type('html');
      res.redirect('/accounts'); // Send user to their accounts
    });
  });

  app.get('/accounts', (req, res) => {
    // alert('Please accept');
    const { token_type, access_token } = accessToken;
    const accountsUrl = 'https://api.monzo.com/accounts';
    
    request.get(accountsUrl, {
      headers: {
        Authorization: `${token_type} ${access_token}`
      }
    }, (req, response, body) => {
      const { accounts } = JSON.parse(body);
  
      res.type('html');
      res.write('<h1>Accounts</h1><ul>');

      res.write(`<li>account = ${accounts}</li>`);
      

      for (let account of accounts){
       const {id, type, description } = account;
        res.write(`
          <li>
            ${description}(<i>${type}</i>) - <a href="/transactions/${id}">View transaction history</a>
          </li>
        `);
        
      
      }
      res.end('</ul>');
    });
});

app.get('/transactions/:acc_id', (req, res) => {
    const { acc_id } = req.params;
    const { token_type, access_token } = accessToken;
    const transactionsUrl = `https://api.monzo.com/transactions?expand[]=merchant&account_id=${acc_id}&limit=30`;
    
    request.get(transactionsUrl, {
      headers: {
        Authorization: `${token_type} ${access_token}` 
      }
    }, (req, response, body) => {
      const { transactions } = JSON.parse(body);
  
      res.type('html');
      res.write(`
        <h1>Transactions</h1>
        <table>
          <thead>
            <th>Description</th>
            <th>Amount</th>
            <th>Category</th>
          </thead>
          <tbody>
      `);
      
      for(let transaction of transactions) {
        const {
          description,
          amount,
          category
        } = transaction;
        
        res.write(`
          <tr>
            <td>${description}</td>
            <td>${(amount/100).toFixed(2)}</td>
            <td>${category}</td>
          </tr>
        `);
      }
      
      res.write('</tbody></table>');
      res.end('<br /><a href="/accounts">&lt; Back to accounts</a>');
    });
  });