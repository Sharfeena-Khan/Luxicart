//const Category = require("../../models/categoryModel")
const Category = require("../models/categoryModel")

const getCategory = async(req,res)=>{
    try {
        console.log("Category");
        const categories = await Category.find();
        res.render("view-Category" , { title:`Luxicart-Category`, categories})
        
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
    const { image } = req.file;
    const trimmedname = name.trim()
    console.log(trimmedname);

    // Check if a category with the same name already exists
    const existingCategory = await Category.findOne({ name :  { $regex: trimmedname, $options: 'i' } });

    if (existingCategory) {
      // If a category with the same name exists, handle the error
      console.log("Category with this name already exists.");
      res.render("add-Category", { title: `Luxicart-Add Category`, message: "Category with this name already exists." });
      return; // Exit the function to prevent further execution
    }

    // Create a new Category document
    const category = new Category({
      name: trimmedname,
      discription: discription,
      image: req.file.filename,
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
    updateSoldQuantity
}