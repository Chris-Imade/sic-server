const express = require("express");
const router = express.Router();
const EventRegistration = require("../models/EventRegistration");
const Contact = require("../models/Contact");
const Newsletter = require("../models/Newsletter");
const { Parser } = require("json2csv");

const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (totalItems, records, page, limit) => {
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, records, totalPages, currentPage };
};

const fetchData = async (model, page, size) => {
    const { limit, offset } = getPagination(page, size);
    const totalItems = await model.countDocuments();
    const records = await model.find().skip(offset).limit(limit);
    const data = {count: totalItems, rows: records};
    return getPagingData(totalItems, records, page, limit);
}

router.get("/", async (req, res) => {
  try {
    const page = req.query.page || 1;
    const size = req.query.size || 10;

    const [eventRegistrations, contacts, newsletters] = await Promise.all([
        fetchData(EventRegistration, page, size),
        fetchData(Contact, page, size),
        fetchData(Newsletter, page, size)
    ]);

    res.render("report", {
      eventRegistrations,
      contacts,
      newsletters,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).send("Error fetching reports");
  }
});

router.get("/download/:model", async (req, res) => {
  try {
    const { model } = req.params;
    let records;
    let Model;

    switch (model) {
      case "eventRegistration":
        Model = EventRegistration;
        break;
      case "contact":
        Model = Contact;
        break;
      case "newsletter":
        Model = Newsletter;
        break;
      default:
        return res.status(400).send("Invalid model");
    }

    records = await Model.find();

    if (!records || records.length === 0) {
      return res.status(404).send("No records found");
    }

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(records.map(record => record.toJSON()));

    res.header("Content-Type", "text/csv");
    res.attachment(`${model}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Error downloading records:", error);
    res.status(500).send("Error downloading records");
  }
});

module.exports = router;
