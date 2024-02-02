//const Category = require("../../models/categoryModel")
const Category = require("../models/categoryModel")
const fs = require('fs').promises
const Sharp = require("sharp")
const path = require("path")



const getCategory = async(req,res)=>{
    try {
        console.log("Category");
        const categories = await Category.find();
        const unlisted = await Category.find({active:false , }, )
        res.render("view-Category" , { title:`Luxicart-Category`, categories, unlisted})
        
    } catch (error) {
        console.log(error);
    }
}


const getCreateCategory = async(req, res)=>{
    try {
        
        res.render("add-Category" , {title:`Luxicart-Add Category`, })

    } catch (error) {
        console.log(error);
    }
}


const addCategory = async (req, res) => {
  try {
    // Extract data from the form submission
    const { name, discription } = req.body;
    const { path: originalImagePath } = req.file;
    const trimmedname = name.trim()
    console.log(req.file.path);

    // Check if a category with the same name already exists
    const existingCategory = await Category.findOne({ name :  { $regex: trimmedname, $options: 'i' } });

    if (existingCategory) {
      // If a category with the same name exists, handle the error
      console.log("Category with this name already exists.");
      res.render("add-Category", { title: `Luxicart-Add Category`, message: "Category with this name already exists." });
      return; // Exit the function to prevent further execution
    }
    // await fs.mkdir('./public/assests/categoryUploads/cropped', { recursive: true });
    const metadata = await Sharp(originalImagePath).metadata();
console.log("Image Metadata:", metadata);


// Use Sharp to create the cropped image
const croppedImagePath = path.join('./public/assests/categoryUploads/cropped', Date.now() + '-cropped-' + req.file.originalname);
await Sharp(originalImagePath)
  .resize({ width: 1000, height: 1500 })
  .toFile(croppedImagePath);


  const croppedImageFileName = path.basename(croppedImagePath);
    // Delete the original image file
    // await fs.unlink(originalImagePath);


    // Create a new Category document
    const category = new Category({
      name: trimmedname,
      discription: discription,
      image: croppedImageFileName,
    });

    // Save the new category to the database
    const savedCategory = await category.save();

    if (savedCategory) {
      // Redirect to the "view Category" page after successful submission
      console.log("Category saved successfully.");
      res.redirect("/admin/adminPanel/category");
    } else {
      console.log("Category not saved.");
      res.render("add-Category", { title: `Luxicart-Add Category` });
    }
  } catch (error) {
    console.error("Error while adding category:", error);
    res.render("add-Category", { title: `Luxicart-Add Category`, error: "Error while adding category." });
 }
};


// ************************************************

const editCategory = async(req,res) =>{
  const id = req.params?.id;
  console.log(id);
  const categories = await Category.findOne({ _id: id })?.exec()
  console.log(categories);
  res.render("edit-category" ,{title:`Luxicart-Add Category`, categories, error: req.flash("error")})
}


const updateCategory = async(req, res)=>{
 try {
  console.log("*******************************   update  *****************");
  const { ID, name, description,  } = req.body
  const trimmedname = name.trim()
  let categories = await Category.findOne({_id: ID})
  console.log(req.body);
  const existingCategory = await Category.findOne({ name :  name });

  if (existingCategory) {
    // If a category with the same name exists, handle the error
    console.log("Category with this name already exists.");
    res.render("edit-Category", { title: `Luxicart-Edit Category`, message: "Category with this name already exists.", categories });
     // Exit the function to prevent further execution
  }else{
    let updatedcategories = await Category.findOneAndUpdate(
      { _id: ID },
      {$set: {
        name:name,
        discription: description,
  
      }},
      {new : true}
    
      )
    console.log(updatedcategories);
    if(updatedcategories){
      res.redirect("/admin/adminPanel/category")
    } else {
      console.log("Category not saved.");
      res.render("edit-Category", { title: `Luxicart-Add Category`, message: "Category not saved." });
    }

  }
  
  
 } catch (error) {
  console.log(error);
 }


}

const updateImage = async(req, res)=>{
  try {
    const { IMG_ID} = req.body
    const { path: originalImagePath } = req.file;
    // console.log(req.body);
    // console.log(req.file);
    const croppedImagePath = path.join('./public/assests/categoryUploads/cropped', Date.now() + '-cropped-' + req.file.originalname);
    await Sharp(originalImagePath)
      .resize({ width: 1000, height: 1500 })
      .toFile(croppedImagePath);
      const croppedImageFileName = path.basename(croppedImagePath);
 
    
    
    let categories = await Category.findOneAndUpdate(
      {_id : IMG_ID},
      {$set : {image :croppedImageFileName}},
      {new : true}
    )
    if(categories){
      console.log("image updated");
      res.redirect('/admin/adminPanel/categories');
    }
    
  } catch (error) {
    console.log(error);
  }
}


const unlistCategory = async(req, res)=>{
  console.log("***********************   Unlisting   ****************");
  console.log(req.body);
  try {
    const {Id } = req.body
    let categoryData = await Category.findOne({_id : Id})
    if(categoryData){
      if(categoryData.active){
        categoryData = await Category.findOneAndUpdate(
          { _id : Id },
          {$set : {active : false}},
          {new : true}
          )
          console.log(categoryData);
          if(categoryData){
            res.json({success : true})
          }
      }else{
        categoryData = await Category.findOneAndUpdate(
          { _id : Id },
          {$set : {active : true}},
          {new : true}
          )
          console.log(categoryData);
          if(categoryData){
            res.json({success : true})
          }
      }
      

    }

     
  } catch (error) {
    console.log(error);
  }
}

const softDelete = async (req, res)=>{
  try {
    const {Id } = req.body
    let categoryData = await Category.findOne({_id : Id})
    if(categoryData){
      categoryData.isDelete = true,

      await categoryData.save()
      
            res.json({success : true})
          }
      
      

    

     
  } catch (error) {
    console.log(error);
  }
}






  const updateSoldQuantity = async (req, res) => {
    const categoryId = req.params.categoryId;
    const newSoldQuantity = req.body.sold;
  
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).send('Category not found');
      }
  
      // Update the "sold" quantity
      category.sold = newSoldQuantity;
      await category.save();
  
      res.redirect('/admin/adminPanel/categories');
    } catch (error) {
      console.error('Error while updating sold quantity:', error);
      res.render('errorPage');
    }
  };

        
  




module.exports = {
    getCategory,
    getCreateCategory,
    addCategory,
    updateSoldQuantity,
    editCategory, 
    updateCategory,
    updateImage,
    unlistCategory,
    softDelete
}