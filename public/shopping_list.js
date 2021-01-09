
//New item


function itemTemplate(item){
    return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            <span class="item-text checkboxx" ><input type="checkbox"id=${item._id} >${item.name}</span>
            <div>
                <button data-id="${item._id}" class="edit btn btn-secondary btn-sm mr-1">Edit</button>
                <button data-id="${item._id}" class="delete btn btn-danger btn-sm">Delete</button>
            </div>
            </li>`
}

function checkedTemplate(item_name){
    return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            <span class="item-text" >${item_name}</span>`
}


// Initial Page Render
let list_item = items.map(function(item){
    return itemTemplate(item)
}).join('')

let list_item2 = checked_stuff.map(function(checked_item){
    return checkedTemplate(checked_item.name)
}).join('')

document.getElementById("item-list").insertAdjacentHTML("beforeend", list_item);
document.getElementById("checked-list").insertAdjacentHTML("beforeend", list_item2);

// Create feature
let createField = document.getElementById("create-field")



document.getElementById("create-form").addEventListener("submit", function(e){
    e.preventDefault()
    axios.post('/create-item', {name: createField.value}).then(function(resp){
    // Create the HTML for a new item
    document.getElementById("item-list").insertAdjacentHTML("beforeend", itemTemplate(resp.data))
    createField.value = ''
    createField.focus();
    }).catch(function(){
        console.log("please try again")
    })
})

document.addEventListener("click", function(e){
    //Update feature
    if (e.target.classList.contains("edit")){
        let userInput = prompt("Edit item", e.target.parentElement.parentElement.querySelector(".item-text").innerText);
        console.log(userInput);
        if (userInput){
            axios.post('/update-item', {name: userInput, id: e.target.getAttribute("data-id")}).then(function(){
                // will act after the post action is done
                // e.target.parentElement.parentElement.querySelector(".item-text").innerHTML = userInput
                // e.target.getAttribute("data-id")
                let item_id = e.target.getAttribute("data-id")
                console.log(item_id)
                // console.log(document.getElementById(item_id).textContent)
                // document.getElementById(e.target.getAttribute("data-id")).textContent = userInput
                // console.log(document.getElementById(item_id).parentElement.lastChild.textContent)
                document.getElementById(item_id).parentElement.lastChild.textContent = userInput
                // console.log(document.getElementById(item_id).parentElement.lastChild.textContent)
              
            }).catch(function(){
                console.log("add Try again")
            })
        }
    }

    //Delete Feature
    if (e.target.classList.contains("delete")){
        if (confirm("Are you sure to delete?")){
            axios.post('/delete-item', {id: e.target.getAttribute("data-id")}).then(function(){
                e.target.parentElement.parentElement.remove()
                
               
            })
        }
    }


    if (document.getElementById(e.target.getAttribute("id")) && e.target.getAttribute("id") !== "create-form" && e.target.getAttribute("id") !== "create-field" ){
        let item_id = e.target.getAttribute("id")
        console.log(e.target.getAttribute("id"))
        let item_name = document.getElementById(item_id).parentElement.lastChild.textContent
        console.log(item_name)
        axios.post('/check-item', {id: e.target.getAttribute("id"), name: item_name }).then(function(){
            // will act after the post action is done
            let li= e.target.parentElement.innerText
            let item_name = li
            console.log(item_name)
      
            document.getElementById("checked-list").insertAdjacentHTML("afterbegin", checkedTemplate(item_name))
        e.target.parentElement.parentElement.remove()
        })
    }
    

})


// Get the previous checked to the lower form