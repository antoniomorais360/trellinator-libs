/**
* @class Attachment
* @memberof module:TrelloEntities
* @param data (Object} key/value pairs of 
* information, must at least contain "id",
* can basically just pass in response from Trello API
* @constructor
* @classdesc The Attachmen class represents
* a card attachment in Trello.
* 
* You will mostly deal with lists in IterableCollections
* returned from Notification or Card methods.
*
* @example
* new Trellinator().attachedLink().name().url();
*/
var Attachment = function(data)
{    
    this.data         = data;
    this.name         = data.name ? data.name:data.text;
    this.url          = data.url;
    this.card_object  = null;

    /**
    * Return the id of this Attachment
    * @memberof module:TrelloEntities.Attachment
    * @example
    * new Notification(posted).attachedLink().id();
    */
    this.id = function()
    {
        return this.data.id;
    }
  
    /**
    * Return the name of this Attachment
    * @memberof module:TrelloEntities.Attachment
    * @example
    * card.cardsLinkedInAttachments().first().name();
    */
    this.text = function()
    {
        if(!this.data.name && !this.data.text)
            this.load();

        return this.data.name ? this.data.name:this.data.text;
    }

    /**
    * Return the url of this Attachment
    * @memberof module:TrelloEntities.Attachment
    * @example
    * card.cardsLinkedInAttachments().first().url();
    */
    this.link = function()
    {
        if(!this.data.url)
            this.load();

        return this.data.url;
    }
    
    this.setContainingCard = function(card)
    {
        this.card_object = card;
        return this;
    }
    
    /**
    * Return the Card that contains this Attachment
    * @memberof module:TrelloEntities.Attachment
    * @example
    * new Notification(posted).attachedLink().card();
    */
    this.card = function()
    {
        return this.card_object;
    }

    /**
    * Set a new name for this Attachment
    * @memberof module:TrelloEntities.List
    * @example
    * new Notification(posted).attachedFile().setName("You attachmed me on "+Trellinator.now().toLocaleString());
    */
    this.setName = function(new_name)
    {
        throw new Error("Unable to set names on attachments until Iain gets a response from Trello support :)");
        return this;
    }
    
    /**
    * Remove this attachment from its containing card
    * and return the containing card
    * @memberof module:TrelloEntities.Attachment
    * @example
    * new Notification(notification).attachedLink().remove().postComment("You can't add links here!");
    */
    this.remove = function()
    {
        TrelloApi.del("cards/"+this.card_object.id()+"/attachments/"+this.id());
        return this.card_object;
    }
    
    /**
    * Archive this list
    * @memberof module:TrelloEntities.List
    * @example
    * card.currentList().archive();
    */
    this.isLink = function()
    {
        if(this.data.previews && !this.data.previews.length)
            return true;
        else if(this.data.previews && this.data.previews.length)
            return false;
        else
            return !this.data.previewUrl;
    }
    
    /**
    * Archive this list
    * @memberof module:TrelloEntities.List
    * @example
    * card.currentList().archive();
    */
    this.isBoard = function()
    {
        return TrelloApi.boardLinkRegExp().test(this.data.url);
    }

    /**
    * Archive this list
    * @memberof module:TrelloEntities.List
    * @example
    * card.currentList().archive();
    */
    this.isCard = function()
    {
        return TrelloApi.cardLinkRegExp().test(this.data.url);
    }

    /**
    * Archive this list
    * @memberof module:TrelloEntities.List
    * @example
    * card.currentList().archive();
    */
    this.isFile = function()
    {
        return !this.isLink();
    }

    //INTERNAL USE ONLY
    this.load = function()
    {
        this.data = TrelloApi.get("lists/"+this.data.id+"?fields=all");
        return this;
    }

    //DEPRECATED used setName
    this.rename = function(new_name)
    {
        var updated = TrelloApi.put("lists/"+this.data.id+"/name?value="+encodeURIComponent(new_name));
        this.data.name = new_name;
        return this;
    }
}
