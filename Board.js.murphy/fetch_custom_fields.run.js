const murphy = require("murphytest");
eval(murphy.load(__dirname,"../Card.js"));
eval(murphy.load(__dirname,"../Notification.js"));
eval(murphy.load(__dirname,"../../trellinator/Trellinator.js"));
eval(murphy.load(__dirname,"../Exceptions.js"));
eval(murphy.load(__dirname,"../Board.js"));
eval(murphy.load(__dirname,"../CustomField.js"));
eval(murphy.load(__dirname,"../Team.js"));
eval(murphy.load(__dirname,"../Member.js"));
eval(murphy.load(__dirname,"../List.js"));
eval(murphy.load(__dirname,"../Checklist.js"));
eval(murphy.load(__dirname,"../CheckItem.js"));
eval(murphy.load(__dirname,"../TrelloApi.js"));
eval(murphy.load(__dirname,"../HttpApi.js"));
eval(murphy.load(__dirname,"../TestConnector.js"));
eval(murphy.load(__dirname,"../IterableCollection.js"));
////////////////////////////////////////////////////////////////////////////
TestConnector.test_base_dir = __dirname;
Trellinator.override_token = "dc1aaaa44446d40ba7a6c1f87e19c222bd172b165b7d5075ec428749e7437181";
new Trellinator().board("Iain Dooley Sandbox").customFields().each(function(field)
{
});
