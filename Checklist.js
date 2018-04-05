var Checklist = function(data)
{
    this.data            = data;
    this.item_list       = null;
    this.added_item      = null;
    this.containing_card = null;
    this.check_items     = null;

    this.convertIntoLinkedCards = function(list,params)
    {
        params.desc = this.card().link();

        this.items().each(function(item)
        {
            params.name = item.name();
            item.setName(Card.create(list,params).link());
        }.bind(this));
    }

    this.isComplete = function()
    {
        var ret = true;

        if(!this.data.checkItems)
            this.load();
        
        new IterableCollection(this.data.checkItems).each(function(elem)
        {
            if(elem.state == "incomplete")
                ret = false;
        });
            
        return ret;
    }

    this.card = function()
    {
        return this.containing_card;
    }
    
    this.setContainingCard = function(card)
    {
        this.containing_card = card;
        return this;
    }

    this.name = function()
    {
        if(!this.data.name)
            this.load();
        
        return this.data.name;
    }

    this.addUniqueItem = function(name,position)
    {
        try
        {
            this.items().findByName(name).first();
        }
        
        catch(e)
        {
            this.addItem(name,position);
        }
        
        return this;
    }

    this.addItem = function(name,position)
    {
        if(!position)
            position = "bottom";

        this.added_item = TrelloApi.post("checklists/"+this.data.id+"/checkItems?name="+encodeURIComponent(name)+"&pos="+encodeURIComponent(position));
        return this;
    }
    
    this.items = function()
    {
        if(!this.item_list)
        {
            this.item_list = new IterableCollection(TrelloApi.get("checklists/"+this.data.id+"/checkItems")).transform(function(item)
            {
                return new CheckItem(item).setContainingChecklist(this);
            }.bind(this));
        }

        return this.item_list;
    }
    
    this.load = function()
    {
        this.data = TrelloApi.get("checklists/"+this.data.id+"?cards=all&checkItems=all&checkItem_fields=all&fields=all");
        return this;
    }
}
