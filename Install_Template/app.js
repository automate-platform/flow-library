
window.onload = function () {
    fetch('http://127.0.0.1:1880/app')
        .then(response => response.json()).then(data => {
            const template = document.querySelector('.monaco-list-rows').innerHTML;
            document.querySelector('.monaco-list-rows').innerHTML = '';
            data.forEach(element => {
                const rendered = Mustache.render(template, element);
                document.querySelector('.monaco-list-rows').innerHTML += rendered;
            });
        })
        .catch(function (error) {
            console.error(error);
        });
}

const template = document.querySelector('.split-view-view').innerHTML;

function openDetailTab(_id) {
    document.querySelector('.split-view-view').style.display = 'block';
    document.querySelector('.split-view-view').innerHTML = '';
    fetch('http://127.0.0.1:1880/app/' + _id)
        .then(response => response.json()).then(data => {
            console.log(data)
            const rendered = Mustache.render(template, data);
            document.querySelector('.split-view-view').innerHTML = rendered;
            // data.forEach(element => {
            //     if (element._id === _id) {
            //         const rendered = Mustache.render(template, element);
            //         document.querySelector('.split-view-view').innerHTML = rendered;
            //     }
            // });
        })
        .catch(function (error) {
            console.error(error);
        });
}

let recommendApp = [];
let installedApp = [];
let currentApp = {};

const base_url = "http://127.0.0.1:1880";

function installExtension(_id) {
    document.querySelector('.spinner-custom').style.display = 'block';
    document.querySelector('.background').style.display = 'block';
    setTimeout(() =>{
        document.querySelector('.spinner-custom').style.display = 'none';
        document.querySelector('.background').style.display = 'none';
    }, 5000)
    var myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Node-RED-API-Version", "v2");
    myHeaders.append("Content-Type", "application/json");

    fetch('http://127.0.0.1:1880/app/' + _id)
        .then(response => response.json()).then(dataRes => {
            currentApp = dataRes;
            const data = JSON.parse(currentApp.flow);
            const param = data[0];
            param.nodes = [];
            param.configs = data.filter(x => x.id != param.id);
            console.log(param)

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(param),
                redirect: 'follow'
            };

            fetch(`${base_url}/admin/flow`, requestOptions)
                .then(response => response.text())
                .then(result => {
                    result = JSON.parse(result)
                    console.log(result);
                    // if (result.id) {
                    //     setTimeout(() => {
                    //         getResource(currentApp.app_id);
                    //     }, 200);
                    // }
                })
                .catch(error => {
                    console.log('error', error);
                    // showSpinner(false);
                    // showMessage("install extension error");
                });
        })
        .catch(function (error) {
            console.error(error);
        });
}

function getResource(appId) {
    var header = new Headers();
    header.append("Accept", "application/json");
    header.append("Node-RED-API-Version", "v2");

    var requestOptions = {
        method: "GET",
        headers: header,
        redirect: "follow",
    };

    fetch(`${base_url}/app/${appId}/install`, requestOptions)
        .then((response) => response.text())
        .then((result) => {
            showMessage("install extension successfully");
            showSpinner(false);
            console.log(result);
        })
        .catch((error) => { showSpinner(false); console.log("error", error) });
}

