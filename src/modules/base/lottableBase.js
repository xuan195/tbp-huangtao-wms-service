const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//创建批属性,options:{userId:xxx,lottables:xxx,whseid:xxx}
async function addLottable(options,extend) {
    var msg =''
 
    //获取批属性信息    
    var _userId = options.userId
    var _whseid = options.whseid
    var _lottables = options.lottables

    var _lottableId = await tools.randomNumber()

    //根据用户编号创建用户
    //{lottableId:xxx,lottables:[{lottableName:批次，required:1，sys:0},{lottableName:收货日期，required:1，sys:1}]}
    var lottableInfo = {
        lottableId:_lottableId,
        whseid:_whseid,
        lottables:_lottables,        
        createWho: _userId,
        createTime:new Date()
    }

    Object.assign(lottableInfo, extend)   

    await db.collection('lottable').add(lottableInfo)
    .then(res => {
        console.log(res)
        msg = _lottableId
    })

    return msg
}

//更新批属性,options:{userId:xxx,lottables:xxx,whseid:xxx}
async function updateLottable(options,extend) {
    var msg =''
 
    //获取批属性信息    
    var _userId = options.userId
    var _lottables = options.lottables
    var _lottable_id = options.lottable_id
   
    //修改批属性配置
    console.log("updateLottable")
    await db.collection('lottable').doc(_lottable_id)
    .update({       
        lottables:_lottables,
        updaeWho: _userId,
        updateTime: new Date()
    })
    .then(res => {
        console.log(res)
    })

    return msg
}

//根据仓库仓库号获取批属性配置
async function findLottableInfoByWh(parms) {

    var _whseid = parms.whseid

     //拼接查询参数
     var lottableWher = {
        whseid: _whseid
    }

    console.log(lottableWher)
    var lottableInfo = await db.collection('lottable')
        .where(lottableWher)
        .get();
    console.log("lottableInfo")
    console.log(lottableInfo)    
    
    return lottableInfo.data
}

//创建仓库默认批属性,options:{userId:xxx,whseid:xxx}
async function addDefaultLottable(options) {
    var msg =''
 
    //获取批属性信息    
    var _userId = options.userId
    var _whseid = options.whseid
        
    var _lottables = [{
        lottableKey:'lottable01',
        lottableName:'批次号',
        required:1,
        sys:1
    },{
        lottableKey:'lottable02',
        lottableName:'收货日期',
        required:1,
        sys:1
    }]

    var _lottableId = await tools.randomNumber()

    //根据用户编号创建用户
    //{lottableId:xxx,lottables:[{lottableName:批次，required:1，sys:0},{lottableName:收货日期，required:1，sys:1}]}
    var lottableInfo = {
        lottableId:_lottableId,
        whseid:_whseid,
        lottables:_lottables,        
        createWho: _userId,
        createTime:new Date()
    }

    await db.collection('lottable').add(lottableInfo)
    .then(res => {
        console.log(res)
        msg = _lottableId
    })

    return msg
}

module.exports.addLottable=addLottable;
module.exports.findLottableInfoByWh=findLottableInfoByWh;
module.exports.updateLottable=updateLottable;
module.exports.addDefaultLottable=addDefaultLottable;