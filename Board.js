var Board = function(data)
{    
    this.data          = data;
    this.list_of_lists = null;

    this.name = function()
    {
        if(!this.data.name)
            this.load();
        
        return this.data.name;
    }
    
    this.link = function()
    {
        return this.shortUrl();
    }

    this.shortUrl = function()
    {
        if(!this.data.shortUrl)
            this.load();
        
        return this.data.shortUrl;
    }
  
    this.moveAllCards = function(data)
    {
        //data.from == RegExp, data.to == RegExp
        var lists = TrelloApi.get("boards/"+this.data.id+"/lists?cards=none&card_fields=none&filter=open&fields=all");
        var from_list = null;
        var to_list = null;

        for(var key in lists)
        {
            if(TrelloApi.nameTest(data.from,lists[key].name))
                from_list = lists[key];
            else if(TrelloApi.nameTest(data.to,lists[key].name))
                to_list = lists[key];
        }
        
        var ret = new IterableCollection(TrelloApi.post("lists/"+from_list.id+"/moveAllCards?idBoard="+to_list.idBoard+"&idList="+to_list.id));
        
        ret.transform(function(elem)
        {
            return new Card(elem);
        });
        
        return ret;
    }
    
    this.member = function(data)
    {
        return this.members(data).first();
    }

    this.members = function(data)
    {
        return this.iterableCollection("boards/"+this.data.id+"/members?fields=fullName,username",
                                       data,
                                       function(elem)
                                       {
                                           return new Member(elem);
                                       });
    }
    
    this.label = function(data)
    {
        return this.labels(data).first();
    }

    this.labels = function(data)
    {
        return this.iterableCollection("boards/"+this.data.id+"/labels?fields=id,name&limit=50",
                                       data,
                                       function(elem)
                                       {
                                           return new Label(elem);
                                       });
    }

    this.list = function(data)
    {
        return this.lists(data).first();
    }

    this.lists = function(data)
    {
        if(!this.list_of_lists)
        {
            this.list_of_lists = new IterableCollection(TrelloApi.get("boards/"+this.data.id+"/lists?cards=none&card_fields=none&filter=open&fields=all"))
                                 .transform(function(elem)
                                 {
                                     return new List(elem);
                                 });
        }
      
        if(data && data.name)
            this.list_of_lists.filterByName(data.name);
      
        return this.list_of_lists;
    }

    this.iterableCollection = function(url,data,callback)
    {
        var ret = new IterableCollection(TrelloApi.get(url));

        ret.transform(callback);

        if(data && data.name)
            ret.filterByName(data.name);
        
        return ret;
    }

    this.cards = function(data)
    {
        var cards = new IterableCollection(TrelloApi.get("boards/"+this.data.id+"/cards?fields=id,name"));

        cards.transform(function(card)
        {
            return new Card(card);
        });
        
        if(data && data.name)
            cards.filterByName(data.name);
        
        return cards;
    }
    
    this.findOrCreateList = function(name)
    {      
      try
      {
        var list = this.list({name: name});
      }
      
      catch(e)
      {
        var list = new List(TrelloApi.post("lists?name="+encodeURIComponent(name)+"&idBoard="+this.data.id+"&pos=top"));
        this.list_of_lists = null;
      }
      
      return list;
    }
    
    this.copy = function(name,team)
    {
        return new Board(TrelloApi.post("/boards/?name="+encodeURIComponent(name)+"&idOrganization="+team.data.id+"&idBoardSource="+this.data.id+"&keepFromSource=cards&prefs_permissionLevel=org&prefs_voting=disabled&prefs_comments=members&prefs_invitations=members&prefs_selfJoin=true&prefs_cardCovers=true&prefs_background=blue&prefs_cardAging=regular"));
    }

    this.addMember = function(member)
    {
        TrelloApi.put("boards/"+this.data.id+"/members/"+member.username()+"?type=admin");
        return this;
    }
}
