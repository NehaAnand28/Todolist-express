//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const dotenv = require('dotenv').config();
mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost:27017", { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: String
});
//model have singular collection name and schema
const Item = new mongoose.model('Item', itemsSchema); //capital start

//create default items to be stored in model
const item1 = new Item({ name: "To Study" });
const item2 = new Item({ name: "To Eat" });
const item3 = new Item({ name: "To Sleep" });

const defaultItems = [item1, item2, item3];

//custom list 
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);



app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      // console.log(items);
      // foundItems.forEach(function (item) {
      //   console.log(item.name);
      // });
      if (foundItems.length === 0) {
        //insert the default items into model
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to database");
          }
        });
        return res.redirect("/");
      }
      return res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    return res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      return res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err, item) {
      if (err) {
        console.log(err);
      } else {
        return res.redirect("/");
        console.log(item + " deleted successfully");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        return res.redirect("/" + listName);
      }
    });
  }

});

app.get("/:customListName", function (req, res) {
  if (req.params.customListName != "favicon.ico") {
    const customListName = req.params.customListName;
    //capitalising the customListName - so home and Home access the same list
    customListName.charAt(0).toUpperCase() + customListName.substring(1);
    List.findOne({ name: customListName }, function (err, foundList) {
      if (!err) {
        if (!foundList) {
          //Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems,
          });
          list.save();
          return res.redirect("/" + customListName);
        } else {
          //Show an existing list

          return res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
          });
        }
      }
    });
  }
});

app.get("/about", function (req, res) {
  return res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
