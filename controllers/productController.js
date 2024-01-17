const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

const { body, validationResult } = require("express-validator");
const flash = require("express-flash");

//          GET METHOD *** PRODUCT PAGE
// ************************************************
const getProductPage = async (req, res) => {
  try {
    console.log("Product Page");
    const products = await Product.find();
    res.render("viewProduct", { title: `Luxicart-Products`, products });
  } catch (error) {
    console.log(error);
  }
};

//          GET METHOD *** ADD-PRODUCT PAGE
// ************************************************

const getAddProduct = async (req, res) => {
  try {
    console.log("Adding page");
    const error = validationResult(req);
    const categories = await Category.find();
    res.render("add-Product", {
      title: `Luxicart-Add Products`,
      categories,
      error: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
  }
};

//          POST METHOD *** ADD-PRODUCT PAGE
// ************************************************
const insertProduct = async (req, res) => {
  const categories = await Category.find();
  const {
    name,
    discription,
    price,
    discountType,
    percentage,
    SKU,
    qty,
    category,
    status,
  } = req.body;

  console.log(req.file);
  console.log(req.body);

  // console.log("name:" , IMG);
  const trimName = name.trim();
  const trimDescription = discription.trim();
  const trimPrice = price.trim();
  const trimSKU = SKU.trim();
  const trimQty = qty.trim();

  if (
    !trimName.replace(/\s/g, "").length ||
    !trimDescription.replace(/\s/g, "").length ||
    !trimPrice.replace(/\s/g, "").length ||
    !trimQty.replace(/\s/g, "").length ||
    !trimSKU.replace(/\s/g, "").length
  ) {
    // req.flash('error', error.array().map(error => error.msg));
    req.flash("error", "Please provide valid values for all required fields.");
    return res.redirect("/admin/adminPanel/products/add-product");
  }

  const insertProductValidationRules = [
    body("name", "Name is required").notEmpty(),
    body("discription", "Description is required").notEmpty(),
    body("price")
      .isNumeric()
      .withMessage("Price must be a number")
      .matches(/^\d*\.?\d+$/),
    body("discountType").notEmpty().withMessage("Discount Type is required"),
    body("percentage").isNumeric().withMessage("Percentage must be a number"),
    body("SKU").notEmpty().withMessage("SKU is required"),
    body("qty").isInt().withMessage("Quantity must be an integer"),
    body("category").notEmpty(),
    body("status").notEmpty().withMessage("Status is required"),
  ];

  try {
    await Promise.all(
      insertProductValidationRules.map((validation) => validation.run(req))
    );

    const error = validationResult(req);

    if (!error.isEmpty()) {
      console.log("page error", error);
      req.flash(
        "error",
        error.array().map((error) => error.msg)
      );
      // req.flash('error', 'Please provide valid values for all required fields.');
      return res.render("add-Product", {
        title: "Luxicart-Products",
        error: req.flash("error"),
        categories,
      });
    }

    const categoryName = req.body.category;
    const categoryType = await Category.findOne({ name: categoryName });
    console.log("categoryName :", categoryType);
    if (!categoryType) {
      console.log("Category is not found");
      res.render("add-Product", { title: `Luxicart-Products` });
    }

    const product = new Product({
      name: name,
      description: discription,
      price: price,

      image: req.file.filename,

      stock: qty,
      category: categoryType.name,
      discountType: discountType,
      discountPercentage: percentage,
      status: status,
      sku: SKU,
    });

    const saveProduct = await product.save();

    if (saveProduct) {
      console.log("new item :", saveProduct);
      res.redirect("/admin/adminPanel/products");
    } else {
      console.log("product is not saved.");
      res.render("add-Product", { categories });
    }
  } catch (error) {
    console.log("Error in insertProduct:", error);
  }
};

//          GET METHOD *** EDIT-PRODUCT PAGE
// ************************************************

const editProducts = async (req, res) => {
  console.log("edit product");
  const categories = await Category.find();
  try {
    const id = req.params?.id;
    const products = await Product.findOne({ _id: id })?.exec();
    // const error = [ "","Failed to save the product."]
    res.render("editProduct", {
      title: `Luxicart- Edit Products`,
      products,
      categories,
      error: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
  }
};

//          POST METHOD *** EDIT-PRODUCT PAGE
// ************************************************

const updateProduct = async (req, res) => {
  try {
    console.log("updating DB");
    const categories = await Category.find();

    const {
      name,
      image,
      description,
      price,
      discountType,
      percentage,
      SKU,
      Qty,
      category,
      status,
      ID,
    } = req.body;

    let products = await Product.findById(ID);
    console.log("-------------------");
    console.log(products);
    console.log("-------------------");
    const trimName = name.trim();
    const trimDescription = description.trim();
    const trimPrice = price.trim();
    const trimSKU = SKU.trim();
    const trimQty = Qty.trim();

    const insertProductValidationRules = [
      body("name", "Name is required").notEmpty(),
      body("description", "Description is required").notEmpty(),
      body("price")
        .isNumeric()
        .withMessage("Price must be a number")
        .matches(/^\d*\.?\d+$/),
      body("discountType").notEmpty().withMessage("Discount Type is required"),
      body("percentage").isNumeric().withMessage("Percentage must be a number"),
      body("SKU").notEmpty().withMessage("SKU is required"),
      body("Qty")
        .isNumeric()
        .withMessage("Quantity must be a number")
        .matches(/^\d*\.?\d+$/),
      body("category").notEmpty(),
      body("status").notEmpty().withMessage("Status is required"),
    ];

    await Promise.all(
      insertProductValidationRules.map((validation) => validation.run(req))
    );
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());

      req.flash(
        "error",
        errors.array().map((error) => error.msg)
      );
      return res.render("editProduct", {
        title: `Luxicart- Edit Products`,
        products,
        categories,
        error: req.flash("error"),
      });
    }
    if (products) {
      products.name = name;
      products.description = description;
      products.price = price;

      products.stock = Qty;
      products.category = category;
      products.discountType = discountType;
      products.discountPercentage = percentage;
      products.status = status;
      products.sku = SKU;

      let productsData = await products.save();

      if (productsData) {
        res.redirect("/admin/adminPanel/products");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// **************       Update Image        *******************

const updatePrd_Image = async (req, res) => {
  const id = req.body.IMG_ID;
  let products = await Product.findById(id);
  const categories = await Category.find();
  const mainImageField = req.files["main_IMG"];
  const subImages = req.files["sub_Img"]?.map((file) => file.filename) || [];
  try {
    if (mainImageField && mainImageField.length > 0) {
      const mainImage = mainImageField[0].filename;

      // Validate main image file type and size
      if (!isValidImage(mainImageField[0])) {
        req.flash("error", "Invalid main image file type or size");
        return res.render("editProduct", {
          title: `Luxicart- Edit Products`,
          products,
          categories,
          error: req.flash("error"),
        });
      }

      for (const subImage of req.files["sub_Img"]) {
        if (!isValidImage(subImage)) {
          req.flash("error", "Invalid sub-image file type or size");
          return res.render("editProduct", {
            title: `Luxicart- Edit Products`,
            products,
            categories,
            error: req.flash("error"),
          });
        }
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { image: mainImage, images: subImages },
        { new: true }
      ).exec();

      if (!product) {
        return res.status(404).send("Product not found");
      }

      res.redirect("/admin/adminPanel/products");
    } else {
      res.status(400).send("Main image field is missing in the request");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Function to validate image file type and size
function isValidImage(file) {
  const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  if (
    !allowedExtensions.exec(file.originalname) ||
    file.size > maxSizeInBytes
  ) {
    return false;
  }

  return true;
}

//          GET METHOD *** DELETE PRODUCT
// ************************************************

const dltPdt = async (req, res) => {
  console.log("delete product1");
  try {
    console.log("delete product");
    const pdtId = req.params.id;
    const data = await Product.findOne({ _id: pdtId });
    console.log("deleting item: ", data);
    const result = await Product.findOneAndDelete({ _id: pdtId });
    if (result) {
      res.redirect("/admin/adminPanel/products");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getProductPage,
  getAddProduct,
  insertProduct,
  editProducts,
  dltPdt,
  updateProduct,
  updatePrd_Image,
};
