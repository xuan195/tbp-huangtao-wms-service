async function setTimeDateFmt(s) {  // 个位数补齐十位数
    return s < 10 ? '0' + s : s;
}

//生产年月日时分秒+六位随机数的单号
async function randomNumber() {
    const now = new Date()
    let month = now.getMonth() + 1
    let day = now.getDate()
    let hour = now.getHours()
    let minutes = now.getMinutes()
    let seconds = now.getSeconds()
    month =await setTimeDateFmt(month)
    day =await setTimeDateFmt(day)
    hour =await setTimeDateFmt(hour)
    minutes =await setTimeDateFmt(minutes)
    seconds =await setTimeDateFmt(seconds)
    let orderCode = now.getFullYear().toString() + month.toString() + day + hour + minutes + seconds + (Math.round(Math.random() * 1000000)).toString();
    //console.log(orderCode)
    return orderCode;
}

//获取数组中指定槽位只的值
async function findSlotValue(slotInfoList,SlotName) {
    var _slotValue = ''

    slotInfoList.forEach((v,i)=>{                   
        Object.keys(v).forEach(v=>{
            // console.log(v)//取到了key
            // console.log(slotInfoList[i][v])//取到了值
            if(v=='SlotName'&&slotInfoList[i][v]==SlotName){
                _slotValue = slotInfoList[i]['SlotValue']                
            }
        })
    })

    return _slotValue
}

module.exports.randomNumber=randomNumber;
module.exports.findSlotValue=findSlotValue;