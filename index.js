const express = require("express"); //include express in this app
const path = require("path"); //module to help with file paths
const { MongoClient, ObjectId } = require("mongodb"); //import MongoClient from mongodb

//DB values
const dbUrl = "mongodb+srv://admin:FJW99VW9tmm65QJf@cluster0.wxujdwc.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(dbUrl);

const app = express(); //create an Express app
const port = process.env.PORT || "8888";

//SET UP TEMPLATE ENGINE (PUG)
app.set("views", path.join(__dirname, "views")); //set up "views" setting to look in the <__dirname>/views folder
app.set("view engine", "pug"); //set up app to use Pug as template engine

//SET UP A PATH FOR STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

//SET UP FOR EASIER FORM DATA PARSING
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//SET UP SOME PAGE ROUTES
app.get("/", async (request, response) => {
    let links = await getLinks();
    let products = await getProducts();
    console.log(products);
    response.render("index", { title: "Home", menu: links, products: products });
});


app.get("/about", async (request, response) => {
  let links = await getLinks();
  let products = await getProducts();
  response.render("about", { title: "About", menu: links, products: products });
});

app.get("/fruitseeds", async (request, response) => {
    let links = await getLinks();
    let products = await getProducts();
    let fruit = await getFruitSeeds();
    response.render("fruitseeds", { title: "Fruit Seeds", menu: links, products: products, fruitseeds: fruit });
  });

// app.get("/additem", async (request, response) => {
//     let links = await getLinks();
//     let products = await getProducts();
//     response.render("additem", { title: "Add Item", menu: links, products: products });
//     response.send('Item added successfully!');
//   });

app.get("/additem", async (request, response) => {
    let links = await getLinks();
    let products = await getProducts();
    response.render("additem", { title: "Add Item", menu: links, products: products });
});


app.get("/vegetableseeds", async (request, response) => {
    let links = await getLinks();
    let products = await getProducts();
    let vegetable = await getVegetableSeeds();
    response.render("vegetableseeds", { title: "Vegetable Seeds", menu: links, products: products, vegetableseeds: vegetable });
  });

//ADMIN PAGES
app.get("/admin/menu", async (request, response) => {
  let links = await getLinks();
  response.render("menu-admin", { title: "Administer menu", menu: links });
})

app.get("/admin/menu/add", async (request, response) => {
    let links = await getLinks();
    response.render("menu-add", { title: "Add menu link", menu: links });
});



app.get("/admin/menu/edit", async (request, response) => {
  if(request.query.linkId)
  {
    let linkToEdit = await getSingleLink(request.query.linkId);
    let links = await getLinks();
    response.render("menu-edit", { title: "Edit menu link", menu: links, editLink: linkToEdit });
  } 
  else 
   { 
     response.redirect("/admin/menu");
    }
});



//ADMIN FORM PROCESSING PATHS
app.post("/admin/menu/add/submit", async (request, response) => {
  //for POST data, retrieve field data using request.body.<field-name>
  //for a GET form, use app.get() and request.query.<field-name> to retrieve the GET form data

  //retrieve values from submitted POST form
  let wgt = request.body.weight;
  //console.log(wgt);
  let path = request.body.path;
  let linkText = request.body.name;
  let newLink = {
    "weight": wgt,
    "path": path,
    "name": linkText
  };
  await addLink(newLink);
  response.redirect("/admin/menu"); //redirect back to Administer menu page
})

app.post("/additem", async (request, response) => {
  let name = request.body.title;
  let image = request.body.image;
  let price = request.body.price;
  let category = request.body.seed;

  let newItem = {
      "name": name,
      "image": image,
      "price": price
  };

  let collectionName = ""; 
    switch (category) {
      case "Fruit Seeds":
        collectionName = "fruitseeds";
        break;
      case "Vegetable Seeds":
        collectionName = "vegetableseeds";
        break;
        default:
        break;
      };
      await addItem(newItem,collectionName)
      response.redirect(`/${collectionName}`)
});


app.post("/subscriber", async (request, response) => {
    let email = request.body.email;
    let newemail = {
        "emailid": email
    };
    await addemail(newemail);
    response.redirect("/"); 
  })
  

app.post("/admin/menu/edit/submit", async (request, response) => {
    let linkId = request.body.linkId;
    let wgt = request.body.weight;
    let path = request.body.path;
    let linkText = request.body.name;
    

    //get the _id and set it as a JSON object to be used for the filter
    let idFilter = { _id: new ObjectId(linkId) };
    //get weight/path/name form values and build a JSON object containing these (updated) values
        let link = {
            "weight": wgt,
            "path": path,
            "name": linkText
        };

    await editLink(idFilter, link);
    //run editLink(idFilter, link) and await the result
    response.redirect("/admin/menu");

});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
});

//MONGODB FUNCTIONS
async function connection() {
  db = client.db("testdb"); //if you have a default db in the connection, you can leave this blank
  return db;
}

//Function to select all documents in the menuLinks collection.
async function getLinks() {
  db = await connection();
  let results = db.collection("menuLinks").find({});
  let res = await results.toArray();
  return res;
}

async function getVegetableSeeds() {
    db = await connection();
    let results = db.collection("vegetableseeds").find({});
    let res = await results.toArray();
    return res;
  }

  async function getFruitSeeds() {
    db = await connection();
    let results = db.collection("fruitseeds").find({});
    let res = await results.toArray();
    return res;
  }

async function getProducts() {
    db = await connection();
    let results = await db.collection("products").find({});
    let res = await results.toArray();
    console.log(res);
    return res;
  }

//Function to insert one link
async function addLink(linkData) {
  db = await connection();
  let status = await db.collection("menuLinks").insertOne(linkData);
  console.log("link added");
}

async function addemail(subscriberData) {
    db = await connection();
    let status = await db.collection("subscriber").insertOne(subscriberData);
    console.log("subscriber added");
}

async function addItem(itemData, collectionName) {
    db = await connection();
    let status = await db.collection(collectionName).insertOne(itemData);
    console.log("Item added");
}

async function getSingleLink(id) {
        db = await connection();
        const editId = { _id: new ObjectId(id) };
        const result = await db.collection("menuLinks").findOne(editId);
        return result;
}

async function editLink(filter, link) {
    db = await connection();

    //create the update set { $set: <JSON document> }
    const updateSet = { $set: {
            "weight": link.weight,
            "path" : link.path,
            "name" : link.name
            }
        };

    //execute an updateOne() to update the link as selected via the filter
   const result =  await db.collection("menuLinks").updateOne(filter,updateSet);
   return result;
   // console.log("Link updated");
    
}