const puppeteer = require('puppeteer');
var fs = require('fs');
let recipes = require('./recipe-urls.json');

(async () => {

    const recipeData = []
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
      }

    for(let recipe of recipes){
        await sleep(5000)
        await page.goto(recipe)
        await sleep(5000)


        const newData = await page.evaluate(() => {
            const instructArr = []
            const ingredArr = []
            let oneList = true
            let instructions
            let ingredients
            let title
            let image
            let caption
            if(document.querySelector("h2.mv-create-title") !== null){
                instructions = document.querySelectorAll("div.mv-create-instructions p")
                for(let instruct of instructions){
                    if(instruct.hasChildNodes()){
                        let children = instruct.childNodes
                        for(let child of children){
                            if(child.nodeName !== "BR"){
                                instructArr.push(child.textContent)
                            }
                        }
                    }
                }

                if(document.querySelector("div.mv-create-ingredients h4") !== null){
                    oneList = false
                    ingredients = document.querySelectorAll("div.mv-create-ingredients h4, div.mv-create-ingredients li")
                    let subArr = [ingredients[0].innerText]
                    for(let i = 1; i < ingredients.length; i++){
                        if(ingredients[i].nodeName !== "H4"){
                            subArr.push(ingredients[i].innerText)
                        }else {
                            ingredArr.push(subArr)
                            subArr = [ingredients[i].innerText]
                        }
                    }
                    ingredArr.push(subArr)
                }else {
                    ingredients = document.querySelectorAll("div.mv-create-ingredients li")
                    for(let ingred of ingredients)
                        ingredArr.push(ingred.innerText)
                }
                title = document.querySelector("h2.mv-create-title").textContent
                image = document.querySelector("article.clearfix img").src
                caption = document.querySelector("article.clearfix p").textContent

            }else {
                instructions = document.querySelectorAll("li.blog-yumprint-method-item")
    
                for(let instruct of instructions){
                    instructArr.push(instruct.textContent)      
                }

                const ingredientSections = document.querySelectorAll("div.blog-yumprint-ingredient-section")
                if(ingredientSections.length > 1){
                    oneList = false
                    for(let section of ingredientSections){
                        let subArr = []
                        subArr.push(section.querySelector("div.blog-yumprint-subheader").textContent)
                        ingredients = section.querySelectorAll("li.blog-yumprint-ingredient-item")
                        for(let ingredient of ingredients){
                            subArr.push(ingredient.textContent)
                        }
                        ingredArr.push(subArr)
                    }
                }else {
                    ingredients = ingredientSections[0].querySelectorAll("li.blog-yumprint-ingredient-item")
                    for(let ingredient of ingredients){
                        ingredArr.push(ingredient.textContent)
                    }
                }
                title = document.querySelector("div.blog-yumprint-recipe-title").textContent
                image = document.querySelector("article.clearfix img").src
                caption = document.querySelector("div.blog-yumprint-recipe-summary").textContent

            }

            return {
                title: title,
                oneList: oneList,
                ingredients: ingredArr,
                instructions: instructArr,
                image: image,
                caption: caption
            }
          });
        const thisData = newData
        //console.log(thisData)
        recipeData.push(thisData)
    }
    
    await browser.close();


    const htmlStart = `<!DOCTYPE html>\n<html>\n<head><link rel="stylesheet" href="mystyle.css"></head><body>\n`
    const htmlEnd = "</body>\n</html>"

    let htmlString = htmlStart

    for(let data of recipeData){
        const htmlPageStart = `<div>\n`
        const htmlPageEnd = `</div>\n`
    
        const pic = `<img class="main-pic" src="${data.image}" height="600" width="400">\n`
    
        const ingredientsHeading = `<h3 class="heading-text">Ingredients</h3>\n`
        const instructionsHeading = `<h3 class="heading-text" id="ingredientHeading">Instructions</h3>\n`
    
        const ingredientsList = () =>{
            let listString = ingredientsHeading
            if(data.oneList){
                listString += "<ul>\n"
                for(let item of data.ingredients){
                    listString += `<li>${item}</li>\n`
                }
                listString += "</ul>\n"
            }else {
                for(let sublist of data.ingredients){
                    for(let i = 0; i < sublist.length; i++){
                        if(i === 0){
                            listString += `<h4 class="heading-text">${sublist[i]}:</h4>\n<ul>\n`
                        }else {
                            listString += `<li>${sublist[i]}</li>\n`
                        }
                    }
                    listString += "</ul>\n"
                }
            
            }
            return listString
        }
    
        const instructionsList = () =>{
            let listString = `${instructionsHeading}<ol>\n`
            for(let item of data.instructions){
                listString += `<li>${item}</li>\n`
            }
            listString += "</ol>\n"
            return listString
        }
        htmlString += `${htmlPageStart}${pic}${ingredientsList()}${instructionsList()}${htmlPageEnd}`
    }
   

    htmlString += `${htmlEnd}`
    
    fs.writeFile('recipe.html', htmlString,function (err) {
        if (err) throw err;
        console.log('Saved!');
    }) 

    // fs.writeFile("recipeTest.json", JSON.stringify(recipeData), (err) => {
    //     if (err) throw err;
    //     console.log("Saved!")
    //   })
  })();