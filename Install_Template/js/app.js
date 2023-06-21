
let templateList = document.querySelector('.monaco-list-rows').innerHTML;
let templateDetail = document.querySelector('.editor-container').innerHTML;
let tabHeader = document.querySelector('.tabs-container').innerHTML;
let base_url = "http://localhost:1880";
let recommendApp = [];
let installedApp = [];
let currentApp = {};

window.onload = function () {
    sessionStorage.clear();
    document.querySelector('.tabs-container').innerHTML = '';
    fetch(base_url + '/app')
        .then(response => response.json()).then(data => {
            document.querySelector('.monaco-list-rows').innerHTML = '';
            data.forEach(element => {
                const rendered = Mustache.render(templateList, element);
                document.querySelector('.monaco-list-rows').innerHTML += rendered;
            });
        })
        .catch(function (error) {
            console.error(error);
        });
}


function openDetail(_id) {
    let tem = document.querySelector('.monaco-scrollable-element').innerHTML
    if (tem.trim() === "") {
        var newDiv = document.createElement("div");
        newDiv.className = "tabs-container";
        var container = document.querySelector('.monaco-scrollable-element');
        container.appendChild(newDiv);
    }
    document.querySelector('.split-view-view').style.display = 'block';
    fetch(base_url + '/app/' + _id)
        .then(response => response.json()).then(data => {
            document.querySelector('.editor-container').innerHTML = '';
            const renderedData = Mustache.render(templateDetail, data);
            const renderedTab = Mustache.render(tabHeader, data);
            const allTabs = document.querySelectorAll('.tab-actions-right');

            document.querySelector('.editor-container').innerHTML = renderedData;
            document.querySelector('.tabs-container').innerHTML += renderedTab;
            var tabs = document.querySelectorAll('.tab-actions-right')
            tabs.forEach((tab) => tab.classList.remove('active'));
            tabs[tabs.length - 1].classList.add('active')

            var clickedElementId = _id;
            var storedIds = sessionStorage.getItem('clickedIds');
            var clickedIds = [];
            if (storedIds) {
                clickedIds = JSON.parse(storedIds);
            }
            clickedIds.push(clickedElementId);
            sessionStorage.setItem('clickedIds', JSON.stringify(clickedIds));
            console.log(clickedIds);
        })
        .catch(function (error) {
            console.error(error);
        });
}


function openDetailTab(_id) {
    document.querySelector('.split-view-view').style.display = 'block';
    fetch(base_url + '/app/' + _id)
        .then(response => response.json()).then(data => {
            document.querySelector('.editor-container').innerHTML = '';
            const renderedData = Mustache.render(templateDetail, data);
            document.querySelector('.editor-container').innerHTML = renderedData;

        })
        .catch(function (error) {
            console.error(error);
        });
    let tabClose = document.querySelectorAll(".tab-actions-right");
    tabClose.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabClose.forEach((tabActive) => tabActive.classList.remove('active'));
            tab.classList.add('active')
        });
    });
}



function closeTab(div) {
    tabActive = JSON.parse(sessionStorage.getItem('clickedIds'));
    let index = tabActive.indexOf(div.id);
    if (tabActive.length < 2) {
        index = 1
    }
    div.remove();
    openDetailTab(tabActive[index - 1]);

    let tabClose = document.querySelectorAll(".tab-actions-right");
    tabClose.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabClose.forEach((tabActive) => tabActive.classList.remove('active'));
            tab.classList.add('active')
        });
    });
    document.getElementById(tabActive[index - 1]).click();
    if (index > -1) {
        tabActive.splice(index, 1);
    }
    sessionStorage.setItem('clickedIds', JSON.stringify(tabActive))
    // console.log(tabActive)
}

function showSpinner(isShow) {
    if (isShow) {
        document.querySelector('.spinner-custom.success').style.display = 'block';
        document.querySelector('.background').style.display = 'block';
        setTimeout(() => {
            document.querySelector('.spinner-custom.success').style.display = 'none';
            document.querySelector('.background').style.display = 'none';
        }, 5000)
    } else {
        document.querySelector('.spinner-custom.error').style.display = 'block';
        document.querySelector('.background').style.display = 'block';
        setTimeout(() => {
            document.querySelector('.spinner-custom.error').style.display = 'none';
            document.querySelector('.background').style.display = 'none';
        }, 5000)
    }
}

function installExtension(_id) {
    var myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Node-RED-API-Version", "v2");
    myHeaders.append("Content-Type", "application/json");

    fetch(base_url + '/app/' + _id)
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
                    // if (result.id) {
                    //     setTimeout(() => {
                    //         getResource(currentApp.app_id);
                    //     }, 200);
                    // }
                    showSpinner(true);
                })
                .catch(function (error) {
                    console.error(error);
                    showSpinner(false);
                });
        })
        .catch(function (error) {
            console.error(error);
        });
}

// function getResource(appId) {
//     var header = new Headers();
//     header.append("Accept", "application/json");
//     header.append("Node-RED-API-Version", "v2");

//     var requestOptions = {
//         method: "GET",
//         headers: header,
//         redirect: "follow",
//     };

//     fetch(`${base_url}/app/${appId}/install`, requestOptions)
//         .then((response) => response.text())
//         .then((result) => {
//             showMessage("install extension successfully");
//             showSpinner(false);
//             console.log(result);
//         })
//         .catch((error) => { showSpinner(false); console.log("error", error) });
// }


$(document).ready(function () {
    $('#myForm').on('input', function (event) {
        event.preventDefault();
        const desc = document.querySelector('#searchForm').value
        $.ajax({
            url: base_url + '/app/search/' + desc,
            success: function (response) {
                if (response) {
                    document.querySelector('.monaco-list-rows').innerHTML = '';
                    response.forEach(element => {
                        const rendered = Mustache.render(templateList, element);
                        document.querySelector('.monaco-list-rows').innerHTML += rendered;
                    });
                } else {
                    fetch(base_url + '/app')
                        .then(response => response.json()).then(data => {
                            document.querySelector('.monaco-list-rows').innerHTML = '';
                            data.forEach(element => {
                                const rendered = Mustache.render(templateList, element);
                                document.querySelector('.monaco-list-rows').innerHTML += rendered;
                            });
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                }
            },
            error: function () {
                console.log('Error submitting the form.');
            }
        });
    });
});