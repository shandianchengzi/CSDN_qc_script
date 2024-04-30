// ==UserScript==
// @name         CSDN质量分显示按钮
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  用于快速查询编辑页CSDN博客质量分的浏览器脚本，详细描述见https://blog.csdn.net/qq_46106285/article/details/138357755
// @author       shandianchengzi
// @match        https://editor.csdn.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=csdn.net
// @grant        GM_registerMenuCommand
// ==/UserScript==

// 主要配置项 访问 https://blog.csdn.net/qq_46106285/article/details/138357755 查看具体获取方式
base_config = "null";
var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json, text/plain, */*",
    "X-Ca-Key": base_config,
    "X-Ca-Nonce": base_config,
    "X-Ca-Signature": base_config,
    "X-Ca-Signature-Headers": "x-ca-key,x-ca-nonce",
    "X-Ca-Signed-Content-Type": "multipart/form-data",
}

var csdn_id = base_config;

function createAButton(element,value,onclick,css,cla="temp"){
    var Button = document.createElement("input");
    Button.type="button";
    Button.value=value;
    Button.onclick=onclick;
    Button.setAttribute("style",css) ;
    Button.setAttribute("class",cla) ;
    element.appendChild(Button);
    return Button;
}

function Toast(msg, duration) {
    duration = isNaN(duration) ? 3000 : duration;
    var m = document.createElement('div');
    m.innerHTML = msg;
    m.style.cssText = "font-family:siyuan;max-width:60%;min-width: 150px;padding:0 14px;height: 40px;color: rgb(255, 255, 255);line-height: 40px;text-align: center;border-radius: 4px;position: fixed;top: 50%;left: 50%;transform: translate(-50%, -50%);z-index: 999999;background: rgba(0, 0, 0,.7);font-size: 16px;";
    document.body.appendChild(m);
    setTimeout(function() {
        var d = 0.5;
        m.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
        m.style.opacity = '0';
        setTimeout(function() {
            document.body.removeChild(m)
        }, d * 1000);
    }, duration);
}

function webQuest(url, method, headers, data, callback) {
    /* url: 请求的 URL
    * method: 请求方法，'GET' 或 'POST'
    * headers: 请求头，一个 dict 对象
    * data: 请求体，一个字符串，形如 'key1=value1&key2=value2'
    * callback: 请求完成后的回调函数，参数是响应的内容
    */
    // 创建一个 XMLHttpRequest 对象
    var xhr = new XMLHttpRequest();

    // 设置请求方法和 URL
    xhr.open(method, url, true);

    // 设置请求头，如果有的话
    for (var key in headers) {
        xhr.setRequestHeader(key, headers[key]);
    }

    // 发送请求
    xhr.send(data);

    // 请求完成后的回调函数
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // 处理响应
            callback(xhr.responseText);
        } else if (xhr.status !== 200) {
            alert("请求 " + url + " 失败，状态码：" + xhr.status + "，请在脚本面板中重新设置 Headers/CSDN ID 或者检查网络代理等状况。" );
        }
    };
}

function questQC(headers, csdn_id) {
    var url = "https://bizapi.csdn.net/trends/api/v1/get-article-score";
    var method = "POST";
    let href = window.location.href;
    // eg: https://editor.csdn.net/md?not_checkout=1&spm=1011.2415.3001.6217&articleId=138357755
    let id = href.match(/articleId=(\d+)/)[1];
    var data = "url=https://blog.csdn.net/" + csdn_id + "/article/details/" + id;
    var callback = function (ret) {
        var response = JSON.parse(ret);
        Toast("质量分: " + response.data.score, 2000);
    }
    // check headers
    if (headers["X-Ca-Key"] == base_config || headers["X-Ca-Nonce"] == base_config || headers["X-Ca-Signature"] == base_config) {
        alert("请先填写 headers 参数再重新查询！");
        fill_headers();
        return;
    }
    // check csdn_id
    if (csdn_id == base_config) {
        alert("请先配置 CSDN ID 再重新查询！");
        fill_csdn_id();
        return;
    }
    webQuest(url, method, headers, data, callback);
}

function userSetValue(key, hint=null) {
    if (hint == null) hint = "请输入" + key + "的值";
    var local_value = localStorage.getItem(key); // When the key does not exist, the return value is "null"
    let ret = window.prompt(hint, local_value);
    if (ret != null) {
        localStorage.setItem(key, ret);
        return ret;
    }
    return local_value;
}

function fill_headers(){
    // store headers in local storage
    var cakey = userSetValue("CSDN_QC_X-Ca-Key", "X-Ca-Key");
    var canonce = userSetValue("CSDN_QC_X-Ca-Nonce", "X-Ca-Nonce");
    var casignature = userSetValue("CSDN_QC_X-Ca-Signature", "X-Ca-Signature");
    // set headers
    headers["X-Ca-Key"] = cakey;
    headers["X-Ca-Nonce"] = canonce;
    headers["X-Ca-Signature"] = casignature;
}

function fill_csdn_id(){
    // store csdn_id in local storage
    var id = userSetValue("CSDN_QC_ID", "CSDN ID");
    // set csdn_id
    csdn_id = id;
}

function init(){
    // get headers from local storage
    var cakey = localStorage.getItem("CSDN_QC_X-Ca-Key");
    var canonce = localStorage.getItem("CSDN_QC_X-Ca-Nonce");
    var casignature = localStorage.getItem("CSDN_QC_X-Ca-Signature");
    // set headers
    headers["X-Ca-Key"] = cakey;
    headers["X-Ca-Nonce"] = canonce;
    headers["X-Ca-Signature"] = casignature;
    // get csdn_id from local storage
    var id = localStorage.getItem("CSDN_QC_ID");
    // set csdn_id
    csdn_id = id;
}

async function mainFunc(){
    // init headers and csdn_id
    init();
    createAButton(document.body,"质量分查询",function(){questQC(headers, csdn_id);},
    "height:75px;position:absolute;z-index:999;");
}

(function() {
    'use strict';
    // add mainFunc to onload
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        mainFunc();
    }
    else {
        window.onload = function() {
            oldonload();
            mainFunc();
        }
    }
    // add menu
    GM_registerMenuCommand("headers 参数填写", fill_headers);
    GM_registerMenuCommand("配置 CSDN ID", fill_csdn_id);
})();