const murphy = require("murphytest");
eval(murphy.load(__dirname,"../Checklist.js"));
eval(murphy.load(__dirname,"../TrelloApi.js"));
eval(murphy.load(__dirname,"../TestConnector.js"));
eval(murphy.load(__dirname,"../IterableCollection.js"));
TestConnector.test_base_dir = __dirname;

new Checklist({id: "5a95df4138a1ec239ce5d520"}).addItem("Checklist item one");
