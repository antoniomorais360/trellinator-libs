var IterableCollection = function(obj)
{
    this.obj = obj;

    this.implode = function(separator,callback)
    {
        var ret = null;

        for(var key in this.obj)
        {
            if(!ret)
                ret = callback(this.obj[key]);
            else
                ret += "&"+callback(this.obj[key]);
        }
        
        return ret;
    }
    
    this.first = function()
    {
        var ret = null;

        for(var key in this.obj)
        {
            if(ret === null)
                ret = this.obj[key];
        }
        
        if(ret === null)
            throw "No data in IterableCollection: "+this.obj;
        
        return ret;
    }

    this.each = function(callback)
    {
        for(var key in this.obj)
            callback(this.obj[key]);
    
        return this;
    }

    this.transform = function(callback)
    {
        for(var key in this.obj)
            this.obj[key] = callback(this.obj[key]);

        return this;
    }
    
    this.length = function()
    {
        return Object.keys(this.obj).length;
    }
    
    this.filterByName = function(expression)
    {
        if(expression)
        {
            var new_obj = [];
            
            for(var key in this.obj)
            {
                if(TrelloApi.nameTest(expression,this.obj[key].name()))
                    new_obj[key] = this.obj[key];
            }
            
            this.obj = new_obj;
        }

        return this;
    }
}
