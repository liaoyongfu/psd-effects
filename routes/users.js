const express = require('express');
const router = express.Router();
const db = require('../db');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/registry', function (req, res, next) {
    const {userName, password} = req.body;
    db.addUser(userName, password).then(function (result) {
        db.getUser(userName, password).then(function (result) {
            req.session.user = result;
            res.json({
                status: true
            });
        });
    });
});

router.get('/getUser', function (req, res, next) {
    res.json({
        status: !!req.session.user,
        user: req.session.user || null
    });
});

router.get('/logout', function (req, res, next) {
    req.session.user = null;
    res.redirect('/');
});

router.post('/login', function (req, res, next) {
    const {userName, password} = req.body;
    db.getUser(userName, password).then(function (result) {
        if (!result) {
            res.json({
                status: false,
                message: '用户名或密码不正确！'
            });
        } else {
            req.session.user = result;
            res.json({
                status: true
            });
        }
    });
});

module.exports = router;
