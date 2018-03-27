var Notification = function(notification)
{
    this.notification = notification;
    
    this.completedChecklistItem = function(name)
    {
        if(this.notification.action.display.translationKey != "action_completed_checkitem")
            throw new Error("No checklist item was completed");

        var ret = new CheckItem(this.notification.action.display.entities.checkitem);
        ret.setContainingChecklist(this.checklist);
        return ret;
    }

    this.member = function()
    {
        return new Member(this.notification.action.memberCreator);
    }

    this.checklist = function()
    {
        return new Checklist(this.notification.action.data.checklist);
    }

    this.completedChecklist = function(name)
    {
        if(this.notification.action.display.translationKey != "action_completed_checkitem")
            throw new Error("No checklist item was completed, therefore no checklist was completed as part of this action");

        var ret = this.checklist();
        
        if(!ret.isComplete())
            throw new Error("The checklist in which the item was checked is not complete");
        else if(name && !TrelloApi.nameTest(name,ret.name()))
            throw new Error("The completed checklist was not named "+name);
        
        ret.setContainingCard(this.card());
        return ret;
    }

    this.listCardWasMovedTo = function()
    {
        if(this.notification.action.display.translationKey == "action_move_card_from_list_to_list")
            var ret = new List(this.notification.action.display.entities.listAfter);
        else
            throw new Error("Card was not moved to a list");
        
        return ret;
    }

    this.listCardWasAddedTo = function()
    {
        if(new IterableCollection(["action_create_card","action_copy_card","action_email_card"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.display.entities.list);
        else if(new IterableCollection(["action_move_card_to_board","action_convert_to_card_from_checkitem"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.data.list);
        else if(new IterableCollection(["action_move_card_from_list_to_list"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.display.entities.listAfter);
        else
            throw new Error("Card was not added to a list");
        
        return ret;
    }

    this.card = function()
    {
        return new Card(this.notification.action.display.entities.card);
    }
}
