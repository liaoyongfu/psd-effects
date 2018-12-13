var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var path = require('path');
var ObjectID = require('mongodb').ObjectID;
var random = require('string-random');
var url = "mongodb://localhost:27017/rendering";

function getDbo() {
    return new Promise(resolve => {
        MongoClient.connect(url, {useNewUrlParser: true}, function (err, db) {
            if (err) throw err;
            var dbo = db.db('rendering');
            resolve({
                dbo: dbo,
                db: db
            });
        });
    })
}

var deleteFolder = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolder(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

/**
 * 获取所有工程
 * @returns {Promise}
 */
exports.getAllProjects = function () {
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            dbo.collection('projects').find().toArray(function (err, result) {
                if (err) throw err;
                resolve(result);
                db.close();
            })
        })
    })
};

exports.getProjectByEnName = function (enName) {
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            dbo.collection('projects').findOne({
                enName: enName
            }, function (err, result) {
                if (err) throw err;
                resolve(result);
            })
        })
    });
};

exports.getProjectByRandom = function (random) {
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            dbo.collection('projects').findOne({
                random: random
            }, function (err, result) {
                if (err) throw err;
                resolve(result);
                db.close();
            })
        })
    });
};

/**
 * 注册用户
 * @param userName
 * @param password
 * @returns {Promise}
 */
exports.addUser = function (userName, password) {
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            // 先找出是否有用户名了
            dbo.collection('users').find({
                userName: userName
            }).toArray(function (err, result) {
                if (err) throw err;

                if (result.length > 0) {
                    resolve({
                        status: false,
                        message: '已经存在用户了，请直接登录！'
                    })
                } else {
                    dbo.collection('users').updateOne(
                        {
                            userName: userName
                        },
                        {
                            $set: {
                                'password': password
                            }
                        },
                        {upsert: true},
                        function (err, result) {
                            if (err) throw err;
                            resolve({
                                status: true,
                                data: result
                            });
                            db.close();
                        }
                    );
                }
            });
        });
    })
};

/**
 * 修改密码
 * @param userName
 * @param newPassword
 * @returns {Promise}
 */
exports.modifypassword = function (userName, newPassword) {
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            dbo.collection('users').updateOne(
                {
                    userName: userName
                },
                {
                    $set: {
                        password: newPassword
                    }
                },
                {upsert: true},
                function (err, result) {
                    if (err) throw err;
                    resolve(result);
                    db.close();
                }
            )
        });
    })
};

/**
 * 获取登录用户信息
 * @param userName
 * @param password
 * @returns {Promise}
 */
exports.getUser = function (userName, password) {
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            dbo.collection('users').findOne({
                userName: userName,
                password: password
            }, function (err, result) {
                if (err) throw err;
                resolve(result);
                db.close();
            })
        })
    })
};

/**
 * 添加工程
 * @param isEdit
 * @param userName
 * @param zhName
 * @param enName
 * @param svn
 * @param svnUserName
 * @param svnPassword
 * @param isPublic
 * @returns {Promise}
 */
exports.addProject = function (isEdit, userName, zhName, enName, svn, svnUserName, svnPassword, isPublic, id) {
    console.log(isPublic);
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            if(isEdit === 'true'){
                // add project
                dbo.collection('projects').findOne({
                    _id: ObjectID(id)
                }, function(err, findResult){
                    if(err) throw err;
                    var oldEnName = findResult.enName;
                    dbo.collection('projects').updateOne(
                        {
                            _id: ObjectID(id)
                        },
                        {
                            $set: {
                                userName: userName, // 创建人
                                zhName: zhName,
                                enName: enName,
                                // svn: svn,    // svn不应该被修改
                                isPublic: isPublic,
                                svnUserName: svnUserName,
                                svnPassword: svnPassword,
                                random: isPublic === 'true' ? enName : random(16)
                            }
                        },
                        function (err, result) {
                            if (err) throw err;

                            if(result.result.nModified > 0){
                                // 修改成功时应该也要修改本地文件命名
                                fs.renameSync(
                                    path.resolve(__dirname, '../project/' + oldEnName),
                                    path.resolve(__dirname, '../project/' + enName)
                                );
                                resolve({
                                    status: true
                                });
                            }else{
                                resolve({
                                    status: false
                                });
                            }
                            db.close();
                        }
                    );
                });
            }else{
                // 新增时，英文名或者svn地址不能重复存在！要生成一个随机访问地址
                dbo.collection('projects').find({
                    $or: [
                        {
                            enName: enName
                        },
                        {
                            svn: svn
                        }
                    ]
                }).toArray(function (err, result) {
                    if (err) throw err;
                    if (result.length > 0) {
                        resolve({
                            status: false,
                            message: '当前项目已经存在，请检查项目英文名或svn是否重复！'
                        });
                    } else {
                        // add project
                        dbo.collection('projects').insert(
                            {
                                userName: userName, // 创建人
                                zhName: zhName,
                                enName: enName,
                                svn: svn,
                                isPublic: isPublic,
                                svnUserName: svnUserName,
                                svnPassword: svnPassword,
                                random: isPublic ?enName : random(16)
                            },
                            function (err, result) {
                                if (err) throw err;
                                resolve({
                                    status: true
                                });
                                db.close();
                            }
                        );
                    }
                });
            }
        });
    })
};

exports.removeProject = function (id, enName) {
    return new Promise(resolve => {
        getDbo().then(function ({dbo, db}) {
            dbo.collection('projects').findOneAndDelete({
                _id: ObjectID(id)
            }, function (err, result) {
                if (err) throw err;
                deleteFolder(path.resolve(__dirname, '../project/' + enName));
                resolve(result);
                db.close();
            })
        })
    })
};
