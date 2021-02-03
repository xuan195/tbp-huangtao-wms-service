const tools = require("../../utils/tools");
const stockBase = require("../inventory/stockBase");
const cloudbase = require("@cloudbase/node-sdk");
const userBase = require("./userBase");
const warehouseBase = require("./warehouseBase");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//根据用户名称和仓库名称创建用户且初始化仓库
async function createUser(para) {
    var msg =''
    var status = 'complete'
      
    //获取用户和仓库信息
    var slotInfoList  = para.SlotInfoList      
     //用户名称
    var _userId = await tools.findSlotValue(slotInfoList,'UserCode')
    //用户密码
    var _password = await tools.findSlotValue(slotInfoList,'Password')
    //仓库名称
    var _warehouse = await tools.findSlotValue(slotInfoList,'Warehouse')
    console.log("_userId:"+_userId+",_warehouse:"+_warehouse)

    //根据仓库名称创建仓库信息,返回仓库编号
    var _woptions = {
        name:_warehouse
    }
    var _whseid = await warehouseBase.addWarehouseByName(_woptions,{})
       
    //根据用户编号和仓库编号创建用户
    var _uoptions = {
        userId:_userId,
        whseid:_whseid,
        password:_password
    }
    var _userId = await userBase.addUserByuserid(_uoptions,{})    
    
    msg = "用户创建成功，用户编号为："+_userId+", 默认仓库为："+_warehouse

    var _body = {userId:_userId,whseid:_whseid,warehouse:_warehouse}

    //补充库存库存信息，物料种类和库存数量
    //新建用户默认货主等于用户编号
    var _storerKey = _userId;
    var stockInfo = await stockBase.findStockInfoByById(_whseid,_storerKey)
    Object.assign(_body, stockInfo)  

    var returnData = {
        Status:status,
        Body:_body,
        Content:msg
    }
    return returnData
}

//用户登录
async function loginUser(para) {
    var msg =''
    var status = 'complete'
    var _storerKey = ''//货主编号
    var _whseid  = ''//仓库编号
    var _warehouse = ''//仓库名称
      
    //获取用户和密码信息
    var slotInfoList  = para.SlotInfoList      
     //用户名称
    var _userId = await tools.findSlotValue(slotInfoList,'UserCode')
    //用户密码
    var _password = await tools.findSlotValue(slotInfoList,'Password')

    console.log("_userId:"+_userId+",_password:"+_password)

    //根据用户和密码查询用户信息    
    var userInfo =await db.collection('users').aggregate()
    .match({
        userId:_userId,
        password:_password
    })
    .lookup({
        from: 'warehouse',
        localField: 'whseid',
        foreignField: 'whseid',
        as: 'warehouse',
    })
    .end()
    console.log("连表查询根据用户和密码查询用户信息")
    console.log(JSON.stringify(userInfo))
    if(userInfo.data[0]){        
        _storerKey = userInfo.data[0].storerKey//货主
        _whseid = userInfo.data[0].whseid//仓库编号                

        //获取仓库名称
        if(userInfo.data[0].warehouse[0]){
            _warehouse = userInfo.data[0].warehouse[0].name
        }  

        msg = "登录成功，用户编号为："+_userId+", 默认仓库为："+_warehouse
    }else{
        status = "error"
        msg = "登录失败，用户或密码不正确"
    }   
    
    var _body = {userId:_userId,storerKey:_storerKey,whseid:_whseid,warehouse:_warehouse}

    //补充库存库存信息，物料种类和库存数量
    var stockInfo = await stockBase.findStockInfoByById(_whseid,_storerKey)

    Object.assign(_body, stockInfo)

    var returnData = {
        Status:status,
        Body:_body,
        Content:msg
    }
    return returnData
}

module.exports.createUser=createUser;
module.exports.loginUser=loginUser;