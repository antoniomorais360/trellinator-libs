/**
* @class Notification
* @constructor
* @param notification {Object} an object that has been posted
* to a webhook from the Trello API
* @classdesc The Notification object takes a 
* notification from the Trello API sent to a 
* webhook and makes it easy to determine what 
* type of event took place and to get access to
* the entities that were part of 
* the notification. The notifications passed into
* this constructor are always sent to webhooks registered
* at the board level. There are 4 types of method:
* 
* - methods that return an object that was the source
*   or origination of this notification, throwing an
*   exception if that object is not present which 
*   indicates in turn that type of notification did
*   not occur. The first part of the function name
*   is the verb, with the object coming after,
*   eg. archivedCard or completedChecklistItem.
*
* - methods that return an entity that was part of
*   the notification, such as board(), card() and
*   member(). Given these notifications are always
*   at the board level, there is always a board()
*   and given every notification originates with an
*   action by a member there is always a member()
*   however there is not always a card(), so if
*   for example this notification is a list name
*   being updated the card() method will throw an
*   InvalidActionException
*
* - Finally there are a couple of convenience 
*   functions that are just shorthand for a 
*   few different common scenarios such as
*   actionOnDueDate and replyToMember
*
* - Static methods that are used globally and
*    are simply grouped within this class for
*    logical reasons
* 
* There are some methods that are deprecated or
* used internally by other class methods so you can
* ignore those, they are marked as such in the
* code comments, but aren't included in the API
* documentation.
*
* Even though all methods are marked as "static"
* by jsdoc, the ones that start with "this." 
* aren't static. I don't know how to make jsdoc
* display them as non-static, so if you do then
* please send a pull request :)
* 
* Methods that deal with detecting whether an
* action took place will throw an InvalidActionException
* if that action did not take place.
*
* Unless you want to explicitly take action in the case
* that some action didn't occur, you don't need to
* catch these exceptions; Trellinator will catch them
* for you. An InvalidActionException is not considered
* "fatal", neither is an InvalidDataException (typically
* thrown by entity classes or the IterableCollection).
*
* If you do want to catch exceptions, you should look
* at the Exceptions.js documentation and the two static methods
* on this class Notification.logException and Notification.expectException
* to see how to do this according to Trellinator best practices
*/
var Notification = function(notification)
{
    this.notification = notification;

    /**
    * If this notification was the result of
    * a member being added to a card, return
    * an object of type Member, otherwise
    * throw an InvalidActionException
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * var notif = new Notification(posted);
    * var comment = "@"+notif.addedMemberToCard().name()+" welcome!";
    * notif.card().postComment(comment);
    */
    this.addedMemberToCard = function()
    {
        return memberAddedToCard();
    }

    /**
    * If a checklist was completed as part of this notification
    * return a Checklist object, otherwise throw an InvalidActionException
    * @memberof Notification
    * @param {string|RegExp} optionally pass in a string or RegExp object
    * to match against the name of the completed checklist
    * @throws InvalidActionException
    * @example 
    * new Notification(posted)
    * .completedChecklist(new RegExp(".*Carmen San Diego.*"))
    * .card().postComment("Great work gumshoe!");
    */
    this.completedChecklist = function(name)
    {
        if(this.notification.action.display.translationKey != "action_completed_checkitem")
            throw new InvalidActionException("No checklist item was completed, therefore no checklist was completed as part of this action");

        var ret = this.checklist();
        
        if(name && !TrelloApi.nameTest(name,ret.name()))
            throw new InvalidActionException("The completed checklist was not named "+name);

        else
        {
            if(!ret.isComplete())
                throw new InvalidActionException("The checklist in which the item was checked is not complete");

            var completed_actions = new Array();
    
            new IterableCollection(TrelloApi.get("cards/"+this.card().data.id+"/actions?filter=updateCheckItemStateOnCard")).each(function(elem)
            {
                if(elem.data.checkItem.state == "complete")
                    completed_actions.push(elem);
            });
    
            if(this.notification.action.id != completed_actions[0].id)
                throw new InvalidActionException("This was not the most recent completed notification so couldn't be the one that caused the checklist to be completed");
        }
        
        ret.setContainingCard(this.card());
        return ret;
    }

    /**
    * Return a Card object if a card was moved 
    * from one list to another (either on the same
    * board or to a different board) as 
    * part of this notification, otherwise throw
    * an InvalidActionException
    * @memberof Notification
    * @param {string|RegExp} optionaly pass in a string
    * or RegExp to match against the name of the LIST 
    * into which the card was moved
    * @throws InvalidActionException
    * @example
    * var notif = new Notification(posted);
    * var card = notif.movedCard(new RegExp("Done.*"));
    * var from = notif.listBefore().name();
    * var to = notif.listAfter().name();
    * card.postComment(from+" to "+to);
    */
    this.movedCard = function(name)
    {
        this.listCardWasMovedTo(name);
        return this.card();
    }

    /**
    * Return a Card object if a card was added
    * to a list as part of this notification.
    * The "added" event can be any way that a card
    * can arrive in a list, either by being
    * created, copied, moved (within the same board
    * or from a different board) or emailed to 
    * the board. If none of these things happened
    * throws an InvalidActionException
    * @memberof Notification
    * @param {string|RegExp} optionaly pass in a string
    * or RegExp to match against the name of the LIST 
    * into which the card was added
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .addedCard(new RegExp("ToDo.*"))
    * .postComment("Hi there!");
    */
    this.addedCard = function(name)
    {
        this.listCardWasAddedTo(name);
        return this.card();
    }
    
    /**
    * Return a Card object if a card was created
    * on this board as part of this notification.
    * The "created" event can be any way that a card
    * can be added to a board for the first time,
    * ie. created by a user, copied from another card
    * including from a different board or emailed to
    * the board. If none of these things happened
    * throws an InvalidActionException
    * @memberof Notification
    * @param {string|RegExp} optionaly pass in a string
    * or RegExp to match against the name of the LIST 
    * in which the card was created
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .createdCard(new RegExp("Incoming.*"))
    * .postComment("Hi there!");
    */
    this.createdCard = function(name)
    {
        this.listCardWasCreatedIn(name);
        return this.card();
    }

    /**
    * Return a Checklist object if a 
    * checklist was added to a card as part
    * of this notification or throw an
    * InvalidActionException
    * @memberof Notification
    * @param name {string|RegExp} optionally pass in a string or RegExp
    * to match against the name of the checklist that was added to the
    * card
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .addedChecklist(new RegExp(".*Ghosts.*"))
    * .addItem("Who you gonna call?");
    */
    this.addedChecklist = function(name)
    {
        if(!this.notification.action.display.translationKey == "action_add_checklist_to_card")
            throw new InvalidActionException("No checklist was added to a card");
        
        var ret = new Checklist(this.notification.action.display.entities.checklist);

        if(name && !TrelloApi.nameTest(name,ret.name()))
            throw new InvalidDataException("A checklist was added but it was not named: "+name+" it was named: "+ret.name());

        ret.setContainingCard(this.card());
        return ret;
    }

    /**
    * Return a List object that a card
    * was moved out of if a card was
    * moved as part of this notification,
    * or return an InvalidActionException
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .listBefore().cards()
    * .first()
    * .postComment("We'll miss you!");
    */
    this.listBefore = function()
    {
        if(notification.action.data.listBefore)
            ret = new List(notification.action.data.listBefore);
        else
            throw new InvalidActionException("No list before");
        
        return ret;
    }

    /**
    * Return a List object that a card
    * was moved into if a card was
    * moved as part of this notification,
    * or return an InvalidActionException
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .listAfter().cards()
    * .first()
    * .postComment("Welcome friend!");
    */
    this.listAfter = function()
    {
        if(notification.action.data.listAfter)
            ret = new List(notification.action.data.listAfter);
        else
            throw new InvalidActionException("No list after");
        
        return ret;
    }

    /**
    * Return a List object that had
    * it's name changed or throws
    * an InvalidActionException if no
    * list name was changed
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .updatedList()
    * .cards().first()
    * .postComment("My name changed");
    */
    this.updatedList = function()
    {
        if(notification.action.data.list)
            ret = new List(notification.action.data.list);
        else
            throw new InvalidActionException("List not updated");
        
        return ret;
    }

    /**
    * Return a Card object if the
    * name/title of the card was
    * changed or throw an InvalidActionException
    * if no card name was changed
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .cardWithNameChanged()
    * .postComment("how dare you!");
    */
    this.cardWithNameChanged = function()
    {
        if(this.notification.action.display.translationKey != "action_renamed_card")
            throw new InvalidActionException("Card name was not changed");
        
        return this.card();
    }

    /**
    * Return a Card object if the
    * due date was marked complete
    * or throw an InvalidActionException
    * if no due date was completed
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .completedDueDate()
    * .postComment("Feels gooood :)");
    */
    this.completedDueDate = function()
    {
        return this.cardDueDateWasCompletedOn();
    }

    /**
    * Return a Member object if the
    * member's username was mentioned
    * in a comment or throw an InvalidActionException
    * if no due date was completed.
    * This will apply only to members who were mentioned
    * who are part of this board, rather than arbitrary
    * strings preceded by an @ sign
    * @memberof Notification
    * @param {string|RegExp} optionally pass in a string
    * or RegExp to match against the mentioned member's
    * username
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .mentionedMember("johnnydepp")
    * .postComment("Yarrrrr");
    */
    this.mentionedMember = function(name)
    {
        return this.memberMentionedInComment(name);
    }

    /**
    * Return an IterableCollection of Member objects
    * that were mentioned in a comment, or throw
    * an InvalidActionException if no members were 
    * mentioned. This applies only to members who
    * are actually on the board, so won't consider
    * any string preceded by an @ sign as a member
    * name
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * var notif = new Notification(posted);
    * notif.mentionedMembers()
    * .each(function(member)
    * {
    *     notif.card().addMember(member);
    * });
    */
    this.mentionedMembers = function()
    {
        return this.membersMentionedInComment();
    }

    /**
    * Return a Comment object if a comment
    * was added to a card as part of this
    * Notification, or throw an InvalidActionException.
    * BEWARE!! It's very easy to create "infinite loops"
    * if you don't filter out comments added by 
    * Trellinator itself.
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * var notif = new Notification(posted);
    * var comment = notif.addedComment();
    * 
    * if(notif.member().notTrellinator())
    *     notif.card().postComment("Okay!");
    */
    this.addedComment = function()
    {
        return this.commentAddedToCard();
    }

    /**
    * Return a Card object if it was archived
    * as part of this notification, or throw
    * an InvalidActionException
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .archivedCard()
    * .unArchive()
    * .postComment("No you don't!");
    */
    this.archivedCard = function()
    {
        if(this.notification.action.display.translationKey != "action_archived_card")
            throw new InvalidActionException("No card was archived in this update");
        
        return this.card();
    }
   
    /**
    * Return a Card object if a due 
    * date was added as part of this notification,
    * or throw an InvalidActionException
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .addedDueDate()
    * .postComment("Roger that!");
    */
    this.addedDueDate = function()
    {
        return this.cardDueDateWasAddedTo();
    }

    /**
    * Return a Label object if a label
    * was added to a card as part of this notification,
    * or throw an InvalidActionException
    * @memberof Notification
    * @param {string|RegExp} optionally pass in a 
    * string or RegExp to match against the name of
    * the label that was added
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .addedLabel(new RegExp("Charles.*"))
    * .postComment("In Charge!");
    */
    this.addedLabel = function(name)
    {
        return this.labelAddedToCard();
    }

    /**
    * Return a Card object if all checklists
    * were completed as part of this notification,
    * or throw an InvalidActionException
    * @memberof Notification
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .completedAllChecklists()
    * .moveToNextList();
    */
    this.completedAllChecklists = function()
    {
        return this.cardAllChecklistsAreCompleteOn();
    }

    /**
    * Return a CheckItem object if it was
    * marked as complete or throw an InvalidActionException
    * @memberof Notification
    * @param {string|RegExp} optionally include a string
    * or RegExp object to match against the text of the completed item
    * @throws InvalidActionException
    * @example
    * new Notification(posted)
    * .completedChecklistItem(new RegExp("URGENT.*"))
    * .card()
    * .postComment("Crisis averted");
    */
    this.completedChecklistItem = function(name)
    {
        if(this.notification.action.display.translationKey != "action_completed_checkitem")
            throw new InvalidActionException("No checklist item was completed");

        var ret = new CheckItem(this.notification.action.display.entities.checkitem);
        
        if(name && (ret.name() != name))
            throw new InvalidActionException("A checklist item was completed but it was not named: "+name);

        ret.setContainingChecklist(this.checklist().setContainingCard(this.card()));
        return ret;
    }

    /**
    * Return the Member object who initiated this
    * notification. Since all notifications are at
    * the board level, this will always return 
    * a valid Member object
    * @memberof Notification
    * @example
    * var notif = new Notification(posted);
    * var comment = notif.member().name()+" dug a hole");
    * notif.card()
    *.postComment(comment);
    */
    this.member = function()
    {
        return new Member(this.notification.action.memberCreator);
    }

    /**
    * Return the Board object on which this action
    * was performed. Since all notifications are at
    * the board level, this will always return 
    * a valid Board object
    * @memberof Notification
    * @example
    * new Notification(posted)
    * .board().card("Updates")
    * .postComment("Something happened!");
    */
    this.board = function()
    {
        return new Board(this.notification.model);
    }

    /**
    * Return the Card object on which this
    * action was performed. If this action
    * was not performed on a card, throw an
    * InvalidActionException
    * @memberof Notification
    * @example
    * new Notification(posted)
    * .card().postComment("You rang?");
    */
    this.card = function()
    {
        if(!this.notification.action.display.entities.card)
            throw new InvalidActionException("No card was part of this notification");

        return new Card(this.notification.action.display.entities.card);
    }

    //This is for internal use only
    this.pushDueDateActionForCard = function(function_name,signature,callback,card)
    {
        var params = {};
        
        if(!callback)
            callback = function(){}
            
        var trigger_signature = signature+card.data.id;
        clear(trigger_signature);
        params = this.notification;
        var date = new Date(card.due());
        callback(date,params);
        ExecutionQueue.push(function_name,params,trigger_signature,date);
    }

    //Deprecated
    this.checklist = function()
    {
        return new Checklist(this.notification.action.data.checklist);
    }

    //Deprecated: use movedCard instead
    this.listCardWasMovedTo = function(name)
    {
        if(this.notification.action.display.translationKey == "action_move_card_from_list_to_list")
            var ret = new List(this.notification.action.display.entities.listAfter);
        else
            throw new InvalidActionException("Card was not moved to a list");

        if(name && !TrelloApi.nameTest(name,ret.name()))
            throw new InvalidActionException("Card was moved to : "+ret.name()+" rather than "+name);
        
        return ret;
    }

    //Deprecated: use createdCard instead
    this.listCardWasCreatedIn = function(name)
    {
        if(new IterableCollection(["action_create_card","action_copy_card","action_email_card"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.display.entities.list);
        else if(new IterableCollection(["action_convert_to_card_from_checkitem"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.data.list);
        else
            throw new InvalidActionException("Card was not created in a list");

        if(name && !TrelloApi.nameTest(name,ret.name()))
            throw new InvalidActionException("Card was created in : "+ret.name()+" rather than "+name);
        
        return ret;
    }

    //Deprecated: use addedCard instead
    this.listCardWasAddedTo = function(name)
    {
        if(new IterableCollection(["action_create_card","action_copy_card","action_email_card"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.display.entities.list);
        else if(new IterableCollection(["action_move_card_to_board","action_convert_to_card_from_checkitem"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.data.list);
        else if(new IterableCollection(["action_move_card_from_list_to_list"]).hasMember(this.notification.action.display.translationKey))
            var ret = new List(this.notification.action.display.entities.listAfter);
        else
            throw new InvalidActionException("Card was not added to a list");

        if(name && !TrelloApi.nameTest(name,ret.name()))
            throw new InvalidActionException("Card was added in: \""+ret.name()+"\" rather than "+name);
        
        return ret;
    }

    //Deprecated: use addedMember instead
    this.memberAddedToCard = function()
    {
      if(
          (this.notification.action.display.translationKey != "action_member_joined_card") &&
          (this.notification.action.display.translationKey != "action_added_member_to_card")
        )
            throw new InvalidActionException("No member added to card");
      
      return new Member(this.notification.action.member);
    }

    //Deprecated: use addedComment instead
    this.commentAddedToCard = function()
    {
        if(this.notification.action.display.translationKey != "action_comment_on_card")
            throw new InvalidActionException("No comment added as part of this notification");
        
        var data = {data: {id: this.notification.action.id,
                    text: this.notification.action.data.text}};
        return new Comment(data).setContainingCard(this.card());
    }

    //Deprecated: use completedDueDate instead
    this.cardDueDateWasCompletedOn = function()
    {
        if(this.notification.action.display.translationKey != "action_marked_the_due_date_complete")
            throw new InvalidActionException("Due date not marked complete");
        
        return this.card();
    }

    //Deprecated: use mentionedMember instead
    this.memberMentionedInComment = function(name)
    {
        return this.membersMentionedInComment().findByName(name).first();
    }

    //Deprecated: use mentionedMembers instead
    this.membersMentionedInComment = function()
    {
        var comment = this.commentAddedToCard();
        var ret     = new Array();

        this.board().members().each(function(member)
        {
            if(new RegExp(".*@"+member.name()+".*").test(comment.text()))
                ret.push(member);
        });
        
        if(!ret.length)
            throw new InvalidActionException("No members were mentioned in this comment");
        
        return new IterableCollection(ret);
    }

    //Deprecated: use dueDateAdded instead
    this.cardDueDateWasAddedTo = function()
    {
        if(
            (this.notification.action.display.translationKey != "action_added_a_due_date")&&
            (this.notification.action.display.translationKey != "action_changed_a_due_date")
          )
            throw new InvalidActionException("No due date was added");
        
        return this.card();
    }

    //Deprecated: use addedLabel instead
    this.labelAddedToCard = function(name)
    {
        if(this.notification.action.display.translationKey != "action_add_label_to_card")
            throw new InvalidActionException("No label as added to a card");
        
        var ret = new Label(this.notification.action.data.label);
        
        if(name && (ret.name() != name))
            throw new InvalidActionException("Label was added, but was not named: "+name);
        
        return ret;
    }

    //Deprecated: use completedAllChecklists instead
    this.cardAllChecklistsAreCompleteOn = function()
    {
        var item = this.completedChecklist();
        
        this.card().checklists().each(function(list)
        {
            if(!list.isComplete())
                throw new InvalidActionException("There is an incomplete checklist on "+this.card().name()+" name "+list.name());
        });
        
        return this.card();
    }
}

/**
* When you catch an exception, throw it again
* if it is not the type you expected. This is 
* useful when catching exceptions thrown by 
* entity classes such as Card and Board. These
* will throw InvalidDataExceptions but will 
* never intentionally throw a ReferenceError
* for example.
* @param type {Function} the constructor function of an
* exception, typically one from Exceptions.js
* @param e {Object} the exception you caught
* @example
* var notif = new Notification(posted);
* //Remove any labels that were added that
* //aren't "Urgent"
* try
* {
*     var label = notif.addedLabel("Urgent");
* }
*
* catch(e)
* {
*     Notification.expectException(InvalidDataException,e);
*     notif.card().removeLabel(notif.addedLabel());
* }
*/
Notification.expectException = function(type,e)
{
    if(e.constructor != type)
        throw e;
}

/**
* Log a message in the Info Log tab if this is a
* non fatal exception, or what is considered
* an "Expected Exception" from the types in 
* Exceptions.js. These are exceptions thrown
* by the Notification class and entity classes
* like Card and Board. This static method will
* write any message from an "expected" exception
* to Info Log and rethrow the exception if it
* isn't one of these types. This method is used
* by Trellinator when executing functions anyway
* so you don't need to wrap all your functions
* using this try/catch, however it can be useful
* to have a shorthand way of creating a log entry
* for expected exceptions and then taking some
* other action, but halting execution if the
* exception was not expected
* @param message {string} prepend the exception message
* @param e {Object} the exception that was caught
* @example
* var notif = new Notification(posted);
*
* try
* {
*     notif.card().postComment("Hi there!");
* }
* 
* catch(e)
* {
*     Notification.logException("We didn't see a card",e);
* }
*/
Notification.logException = function(message,e)
{
    if(e.constructor == InvalidDataException)
        writeInfo_(message+": "+e);
    else if(e.constructor == InvalidActionException)
        writeInfo_(message+": "+e);
    else
        throw e;
}

//Deprecated
Notification.fromDueDateAction = function(params)
{
    var ret = null;

    if(params.notification)
        ret = new Notification(params.notification.notification);
    else
        ret = new Notification(params);

    return ret;
}
