const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const db = app.database();
const _ = db.command

//根据库存信息和订单信息创建拣货明细,options:{userId:x,whseid:x,storerKey:x,sku:x,orderKey:x,
//pickQty:x,loc:x,waveKey:x,caseid:x}
async function addPickdetail(options,extend) {
    //{whseid:00001，pickdetailkey：xxx，storerKey：00001，sku：sku001，orderKey：0000000001，
    //status：xxx，lot：xxx，loc：xxx，lpn：xxx，dropid：xx,fromLoc:x,toloc：xxx，qty：100，caseid：xxx}
    var msg =''
    
    //获取拣货明细信息
    var _whseid = options.whseid
    var _storerKey = options.storerKey
    var _sku = options.sku
    var _orderKey = options.orderKey
    var _pickQty = options.pickQty
    var _loc = options.loc
    var _userId = options.userId
    var _waveKey = options.waveKey
    var _caseid = options.caseid
    
    var _pickdetailKey = await tools.randomNumber()
    
    //根据货品创建收货单
    var pickdetailInfo = {
        whseid:_whseid,
        pickdetailKey:_pickdetailKey,
        storerKey:_storerKey,        
        sku:_sku,
        orderKey:_orderKey,
        status:0,
        qty:_pickQty,
        loc:_loc,
        fromLoc:_loc,
        lpn:' ',
        lot:' ',
        toLoc:'PICKTO',
        dropid:' ',
        createWho:_userId,
        updateWho:_userId,
        waveKey:_waveKey,
        caseid:_caseid
    }

    Object.assign(pickdetailInfo, extend)   
    console.log('addPickdetail')
    console.log(pickdetailInfo)
    await db.collection('pickdetail').add(pickdetailInfo)
    .then(res => {
        console.log(res)
        msg = _pickdetailKey
    })

    return msg
}

module.exports.addPickdetail=addPickdetail;
