class Bot{    
    constructor(_intentName,_eventbody){
        this.intentName = _intentName
        this.eventbody = _eventbody
    }
    async answer(){
        var returnData = { Status: 'complete', Content: '' }
        return returnData
    }
}

module.exports = Bot;