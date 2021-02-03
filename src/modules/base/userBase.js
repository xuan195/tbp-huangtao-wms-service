const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//创建用户,options:{userId:xxx,password:xxx,whseid:xxx}
async function addUserByuserid(options,extend) {
    var msg =''
 
    //获取用户信息    
    var _userId = options.userId
    var _password = options.password
    var _whseid = options.whseid 
    
    //根据用户编号创建用户
    //{userId：hxs，name：黄旭，email：xxx@126.com，
    //role:[角色编号],whseid：xxx,storerKey：00001}
    var userInfo = {
        userId:_userId,
        password:_password,
        name:_userId,
        email:'',     
        role:'[]',
        whseid:_whseid,
        storerKey:_userId
    }

    Object.assign(userInfo, extend)   

    await db.collection('users').add(userInfo)
    .then(res => {
        console.log(res)
        msg = _userId
    })

    return msg
}

//根据用户编号获取用户信息和仓库信息
async function findUserInfoByById(_userId) {

    var _storerKey = ''//货主编号
    var _whseid  = ''//仓库编号
    var _warehouse = ''//仓库名称
             
    //根据用户和密码查询用户信息    
    var userInfo =await db.collection('users').aggregate()
    .match({userId:_userId})
    .lookup({
        from: 'warehouse',
        localField: 'whseid',
        foreignField: 'whseid',
        as: 'warehouse',
    })
    .end()
    console.log("连表查询")
    console.log(JSON.stringify(userInfo))
    // {"requestId":"174517c0675_1","data":[{"_id":"b5416b755f4df34500e11ee70add1aff","userId":"mina","name":"mina","email":"","role":"[]",
    //"whseid":"20200901070749588683","storerKey":"nina","password":"123",
    //"warehouse":[{"_id":"8a6c3bf65f4df345009f311e42a1f421","whseid":"20200901070749588683","name":"株洲船形仓","desc":"株洲船形仓"}]}]}
    
    if(userInfo.data[0]){        
        _storerKey = userInfo.data[0].storerKey//货主
        _whseid = userInfo.data[0].whseid//仓库编号            

        //获取仓库名称
        if(userInfo.data[0].warehouse[0]){
            _warehouse = userInfo.data[0].warehouse[0].name
        }              
    }    

    var returnData = {
        userId:_userId,
        storerKey:_storerKey,
        whseid:_whseid,
        warehouse:_warehouse
    }
    console.log(returnData)
    return returnData
}

module.exports.addUserByuserid=addUserByuserid;
module.exports.findUserInfoByById=findUserInfoByById;