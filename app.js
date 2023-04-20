//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lo = require("Lodash");

const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/toDoListDB");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = {
  name: "String"
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your toDoList."
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

// app.get("/", function(req, res) {
//
//   var items;
//   async function fd() {
//     items = await Item.find({});
//   }
//   fd();
//
//   console.log(items);
//
//   res.render("list", {listTitle: "Today", newListItems: items});
// });

app.get("/",async function(req, res) {

  var items = await Item.find({});

  if (items.length === 0) {
    Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: items});
  }
});

app.post("/",async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    const list = await List.findOne({name: listName}).exec();
    list.items.push(item);
    list.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete",async function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    } catch(err) {
      console.log("Error");
    }
  }
  else {
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
    res.redirect("/" + listName);
  }
});

app.get("/:name",async function(req,res){
  const routeName = lo.capitalize(req.params.name);

    const foundList = await List.findOne({name: routeName}).exec();

    if (foundList !== null) {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    } else {
      const list = new List({
        name: routeName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + routeName);
    }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
