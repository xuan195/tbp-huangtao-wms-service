const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//创建批属性库存表
async function addLotattribute(options,extend) {
    var msg =''
 
    //获取批属性信息    
    var _userId = options.userId
    var _storerKey = options.storerKey
    var _whseid = options.whseid
    var _sku = options.sku
    var _lottables = options.lottables

    var _lot = await tools.randomNumber()

    //根据用户编号创建用户
    //whseid:00001，storerKey：xxx，sku：SKU001，lot：xxx，
    //lottables:[{lottableKey：lottable01，lottableValue:xxx}，{lottableKey：lottable02，lottableValue:xxx}]
    var lotattributeInfo = {
        whseid:_whseid,
        storerKey:_storerKey,
        sku:_sku,
        lot:_lot,
        lottables:_lottables,        
        createWho: _userId,
        createTime:new Date()
    }

    Object.assign(lotattributeInfo, extend)   

    await db.collection('lotattribute').add(lotattributeInfo)
    .then(res => {
        console.log(res)
        msg = _lot
    })

    return msg
}

//根据库存批属性表ID更新批属性
async function updateLotattribute(options,extend) {
    var msg =''
 
    //获取批属性信息    
    var _userId = options.userId
    var _lottables = options.lottables
    var _id = options._id
   
    //修改库存批属性值
    console.log("updateLottable")
    await db.collection('lottable').doc(_id)
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

//根据批属性值查询批属性号
async function findLotattributeInfoByValues(parms) {
    
    var _storerKey = parms.storerKey
    var _whseid = parms.whseid
    var _sku = parms.sku
    var _lottables = parms.lottables

    // db.collection('table').where({tag:{type:'拳击'},tag:{point:_.gt(6)}}).then()
    
    //拼接查询参数
    var lotattributeWher = {
        whseid: _whseid,
        storerKey: _storerKey,
        sku: _sku,
        whseid: _whseid,
        lottables:_lottables
    }

    console.log(lotattributeWher)
    var lotattributeInfo = await db.collection('lotattribute')
        .where(lotattributeWher)
        .get();
    console.log("lotattributeInfo")
    console.log(lotattributeInfo)
    
    return lotattributeInfo.data
}

//创建库存批属性记录
async function createLotattributeByValues(parms) {
    
    //系统批次号
    var lot = ''

    //查询批属性是否已存在，如果存在返回系统批次号，如果不存在创建库存批属性记录
    var lottableInfo = await findLotattributeInfoByValues(parms)
    if(lottableInfo[0]){
        //获取批属性信息    
        lot = lottableInfo[0].lot
    }else{
        
        lot = await addLotattribute(parms)
    }
    
    console.log("createLotattributeByValues")
    console.log(lot)
    
    return lot
}

module.exports.addLotattribute=addLotattribute;
module.exports.findLotattributeInfoByValues=findLotattributeInfoByValues;
module.exports.updateLotattribute=updateLotattribute;
module.exports.createLotattributeByValues=createLotattributeByValues;