const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//创建仓库信息,options:{name：炎陵新生黄家}
async function addWarehouseByName(options,extend) {
    var msg =''
   
    //获取仓库信息   
    var _name = options.name

    //生产唯一仓库号
    var _whseid = await tools.randomNumber()

    //根据仓库名称创建仓库
    //{whseid:00001，name：炎陵新生黄家，desc:新生黄家}
    var warehouseInfo = {
        whseid:_whseid,
        name:_name,
        desc:_name
    }

    Object.assign(warehouseInfo, extend)   

    await db.collection('warehouse').add(warehouseInfo)
    .then(res => {
        console.log(res)
        msg = _whseid
    })

    return msg
}

//根据仓库编号获取仓库名称
async function findWarehouseNameById(_whseid) {
    var _name =''  

    //根据仓库编号获取仓库名称
    var warehouseInfo = await db.collection('warehouse')
    .where({
        whseid:_whseid,
    })
    .get()
    if(warehouseInfo.data[0]){

        _name = warehouseInfo.data[0].name
    }

    return _name
}

module.exports.addWarehouseByName=addWarehouseByName;
module.exports.findWarehouseNameById=findWarehouseNameById;
