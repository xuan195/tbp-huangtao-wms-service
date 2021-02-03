const tools = require("../../utils/tools");
const stockBase = require("../inventory/stockBase");
const lotattributeBase = require("../inventory/lotattributeBase");
const lottableBase = require("../base/lottableBase");

const userBase = require("../base/userBase");
const receiptBase = require("./receiptBase");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//无ASN按货品收货
async function receiveBySku(para) {
    var msg =''
    var status = 'complete'

    var _userId = para.UserId;
    //根据用户号获取默认仓库号、货主
    var userInfo  = await userBase.findUserInfoByById(_userId)
    var _whseid = userInfo.whseid
    var _storerKey = userInfo.storerKey
    var _warehouse= userInfo.warehouse

    //获取单号信息
    var slotInfoList  = para.SlotInfoList      
    var _sku = await tools.findSlotValue(slotInfoList,'sku')
    var _receiptQty = Number(await tools.findSlotValue(slotInfoList,'receiptQty'))
    console.log("_whseid:"+_whseid+",_storerKey:"+_storerKey+",_sku:"+_sku+",userid:"+_userId+',_receiptQty'+_receiptQty)


    //批属性配置ID
    var _lottableId = ''
    //批属性配置值
    var _lottables = {
        lottable01:'',
        lottable02:new Date().toLocaleDateString()
    }

    //根据货品创建收货单
    var _options = {
        userId:_userId,
        sku:_sku,
        whseid:_whseid,
        storerKey:_storerKey,
        receiptQty:_receiptQty
    }
    var _receiptKey = await receiptBase.addReceiptBySku(_options,{lottableId:_lottableId,lottables:_lottables})
    
    //调用收货API
    //拼装参数
    var receivePara = {
        'userId':_userId,
        'whseid':_whseid,
        'receiptKey':_receiptKey,
        'receiptQty':'',
        'toLoc':'',
        'toId':'',
    }
    //调用收货API
    msg = await receiveBase(receivePara)
    //msg = "继续按物料收货"


    var _body = {userId:_userId,whseid:_whseid,warehouse:_warehouse,sku:_sku}
    //补充库存库存信息，物料种类和库存数量
    var stockInfo = await stockBase.findStockInfoByById(_whseid,_storerKey)

    Object.assign(_body, stockInfo)  
    
    //补充指定物料的库存信息
    var skustockInfo = await stockBase.findStockInfoByBySku(_whseid,_storerKey,_sku)

    Object.assign(_body, skustockInfo)  

    var returnData = {
        Status:status,
        Body:_body,
        Content:msg
    }
    return returnData
}

//无ASN按批次号收货
async function receiveByLot(para) {
    var msg =''
    var status = 'complete'

    var _userId = para.UserId;
    //根据用户号获取默认仓库号、货主
    var userInfo  = await userBase.findUserInfoByById(_userId)
    var _whseid = userInfo.whseid
    var _storerKey = userInfo.storerKey
    var _warehouse= userInfo.warehouse

    //获取单号信息
    var slotInfoList  = para.SlotInfoList      
    var _sku = await tools.findSlotValue(slotInfoList,'sku')
    var _lotcode = await tools.findSlotValue(slotInfoList,'lotcode')
    var _receiptQty = Number(await tools.findSlotValue(slotInfoList,'receiptQty'))
    console.log("_whseid:"+_whseid+",_storerKey:"+_storerKey+",_sku:"+_sku+",_lotcode:"+_lotcode+",userid:"+_userId+',_receiptQty'+_receiptQty)

    //根据仓库号获取批属性配置
    var lottableInfo = await lottableBase.findLottableInfoByWh({whseid:_whseid})
    //如果未配置批属性，系统自动创建批属性设置
    if(!lottableInfo[0]){
        await lottableBase.addDefaultLottable({userId:_userId,whseid:_whseid})
        lottableInfo = await lottableBase.findLottableInfoByWh({whseid:_whseid})
    }
    //批属性配置ID
    var _lottableId = ''
    //批属性配置值
    var _lottables = {}

    if(lottableInfo[0]){
        _lottableId = lottableInfo[0].lottableId
        var lottableList = lottableInfo[0].lottables
        //将数组转成批属性参数
        lottableList.forEach(function(v,i,a){
            console.log(v)
            if(i==0){
                _lottables['lottable01'] = _lotcode
            }else if(i==1){
                _lottables['lottable02'] = new Date().toLocaleDateString()
            }else{
                _lottables[v.lottableKey] = ''
            }      
        
        });
        console.log(_lottables)
    }

    //根据货品创建收货单
    var _options = {
        userId:_userId,
        sku:_sku,
        whseid:_whseid,
        storerKey:_storerKey,
        receiptQty:_receiptQty
    }
    var _receiptKey = await receiptBase.addReceiptBySku(_options,{lottableId:_lottableId,lottables:_lottables})
    
    //调用收货API
    //拼装参数
    var receivePara = {
        'userId':_userId,
        'whseid':_whseid,
        'receiptKey':_receiptKey,
        'receiptQty':'',
        'lotcode':_lotcode,
        'toLoc':'',
        'toId':'',
    }
    //调用收货API
    msg = await receiveBase(receivePara)

    var _body = {userId:_userId,whseid:_whseid,warehouse:_warehouse,sku:_sku}
    //补充库存库存信息，物料种类和库存数量
    var stockInfo = await stockBase.findStockInfoByById(_whseid,_storerKey)

    Object.assign(_body, stockInfo)  
    
    //补充指定物料的库存信息
    var skustockInfo = await stockBase.findStockInfoByBySku(_whseid,_storerKey,_sku)

    Object.assign(_body, skustockInfo)  

    var returnData = {
        Status:status,
        Body:_body,
        Content:msg
    }
    return returnData
}

//按单号收货
async function receiveByAsnno(para) {
    var msg = ''
    var status = 'complete'

    var _userId = para.UserId;
    //根据用户号获取默认仓库号
    var userInfo  = await userBase.findUserInfoByById(_userId)
    var _whseid = userInfo.whseid
    var _storerKey = userInfo.storerKey
    var _warehouse= userInfo.warehouse
      
    //获取单号信息
    var slotInfoList  = para.SlotInfoList      
    var _receiptKey = await tools.findSlotValue(slotInfoList,'receiptKey')
    var _receiptQty = await tools.findSlotValue(slotInfoList,'receiptQty')
    if(_receiptQty!=''){
        _receiptQty = Number(_receiptQty)
    }
    console.log("ASNNO1:"+_receiptKey+",userid:"+_userId)

    //调用收货API
    //拼装参数
    var receivePara = {
        'userId':_userId,
        'whseid':_whseid,
        'receiptKey':_receiptKey,
        'receiptQty':_receiptQty,
        'toLoc':'',
        'toId':'',
    }
    //调用收货API
    msg = await receiveBase(receivePara)
    
    var _body = {userId:_userId,whseid:_whseid,warehouse:_warehouse}
    //补充库存库存信息，物料种类和库存数量
    var stockInfo = await stockBase.findStockInfoByById(_whseid,_storerKey)

    Object.assign(_body, stockInfo) 

    var returnData = {
        Status:status,
        Body:_body,
        Content:msg
    }
    console.log(returnData)
    return returnData
}

//收货API
async function receiveBase(para) {
    var msg = '';
    console.log(para)
    var _userId = para.userId //用户id
    var _whseid = para.whseid//仓库号
    var _receiptKey  = para.receiptKey //收货单号
    var _receiptQty = para.receiptQty //收货数量
    var _toLoc =  para.toLoc//收货库位
    var _toId =  para.toId//收货箱号
    var _lotcode = para.lotcode//批次号
    
    //根据收货单号查询收货单信息
    var receiptInfo = await db.collection('receipt')
    .where({
        whseid:_whseid,
        receiptKey:_receiptKey
    })
    .get()
    console.log("receiptInfo")
    console.log(receiptInfo)
    if(receiptInfo.data[0]){        
        var _storerKey = receiptInfo.data[0].storerKey//货主     
        var _sku = receiptInfo.data[0].sku//货品编码
        var _lottables = receiptInfo.data[0].lottables
        
        //批次 根据批属性计算唯一批次       
        var LotParms = {
            userId:_userId,
            storerKey:_storerKey,
            whseid:_whseid,
            sku:_sku,
            lottables:_lottables
        }
        var _toLot = await lotattributeBase.createLotattributeByValues(LotParms)

        var _qtyexpected = receiptInfo.data[0].qtyexpected//预收数量
        var _qtyreceived = receiptInfo.data[0].qtyreceived//收货数量
        var _needQty = 0 //剩余收货数量
        if(_qtyexpected-_qtyreceived>0){
            _needQty = _qtyexpected-_qtyreceived
        }       
        _toLoc =  _toLoc!=''?_toLoc:receiptInfo.data[0].toLoc//收货库位
        _toId =  _toId!=''?_toId:receiptInfo.data[0].toId//收货箱号
        _receiptQty = _receiptQty!=''?_receiptQty:_needQty
        console.log("_needQty"+_needQty)
        console.log("_receiptQty"+_receiptQty)
        console.log("lotxlocxlpn")
        console.log({
            whseid:_whseid,
            storerKey:_storerKey,
            sku:_sku,
            lot:_toLot,
            loc:_toLoc,
            lpn:_toId
        })

        //增加库存
        //剩余库存数量
        var stockQty = _receiptQty;
        //查询库存记录是否存在，如果存在增加库存数量，如果不存在新增库存记录
        var lotxlocxlpnInfo = await db.collection('lotxlocxlpn')
        .where({
                whseid:_whseid,
                storerKey:_storerKey,
                sku:_sku,
                lot:_toLot,
                loc:_toLoc,
                lpn:_toId
        })
        .get();
        console.log("lotxlocxlpninfo")
        console.log(lotxlocxlpnInfo)
        if(lotxlocxlpnInfo.data[0]){
            //增加库存数量
            console.log('增加库存数量')
            await db.collection('lotxlocxlpn').doc(lotxlocxlpnInfo.data[0]._id)
            .update({
                // 表示指示数据库将字段自增收货数量
                qty: _.inc(_receiptQty),
                qtyavailable: _.inc(_receiptQty)
            })
            .then(res => {
                console.log(res)
                stockQty = lotxlocxlpnInfo.data[0].qty + _receiptQty;
            })
        }else{
            //新增库存记录
            console.log('新增库存记录')
            await db.collection('lotxlocxlpn').add({            
                whseid:_whseid,
                storerKey:_storerKey,
                sku:_sku,
                lot:_toLot,
                loc:_toLoc,
                lpn:_toId,
                status:'OK',
                qty:_receiptQty,
                qtyallocated:0,
                qtypicked:0,
                qtyonhold:0,
                qtyavailable:_receiptQty
            })
            .then(res => {
                console.log(res)
            })
        }

        //收货后状态
        var _status = (_qtyreceived+_receiptQty>=_qtyexpected)?9:5;
        //更新收货单信息
        await db.collection('receipt').doc(receiptInfo.data[0]._id)
            .update({
                // 表示指示数据库将字段自增收货数量
                qtyreceived: _.inc(_receiptQty),
                status:_status
            })
            .then(res => {
                console.log(res)
            })

        if(_lotcode){
            msg = 'ASN收货成功，库存信息如下:货品:'+_sku+',批次号:'+_lotcode+',本次收货数:'+_receiptQty+',剩余库存数:'+stockQty
        }else{
            msg = 'ASN收货成功，库存信息如下:货品:'+_sku+',本次收货数:'+_receiptQty+',剩余库存数:'+stockQty
        }
        
    }else{
        msg = '收货单号不存在'
    }    

    

    return msg
}

module.exports.receiveByAsnno=receiveByAsnno;
module.exports.receiveBySku=receiveBySku;
module.exports.receiveByLot=receiveByLot;
