/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/log'],
    (record, search, log) => {

        /**
         * POST entry point - Calls the function to create fulfillment.
         */
        const post = (requestBody) => {
            return JSON.stringify(createItemFulfillment(requestBody.salesRecId));
        };

        /**
         * GET entry point - Calls the function to retrieve sales order details.
         */
        const get = (requestParams) => {
            return JSON.stringify(fetchSalesOrderDetails(requestParams.tranid));
        };

        /**
         * PUT entry point - Calls the function to update fulfillment.
         */
        const put = (requestBody) => {
            return JSON.stringify(updateItemFulfillment(requestBody.tranid, requestBody.memo));
        };

        /**
         * DELETE entry point - Calls the function to delete fulfillment.
         */
        const doDelete = (requestParams) => {
            return JSON.stringify(deleteItemFulfillment(requestParams.recordId));
        };

        /**
         * Creates an item fulfillment record based on a sales order ID.
         * @param {number} salesOrderId - The internal ID of the sales order.
         * @returns {Object} JSON response with success or error status.
         */
        const createItemFulfillment = (salesOrderId) => {
            try {
                let itemFulfillmentRec = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.ITEM_FULFILLMENT,
                    isDynamic: true
                });

                let itemFulfillmentId = itemFulfillmentRec.save({
                    ignoreMandatoryFields: true
                });

                return {
                    status: "successful",
                    newId: itemFulfillmentId,
                    message: "Created fulfillment record successfully"
                };

            } catch (error) {
                log.error('Error creating item fulfillment', error);
                return {
                    status: 'failed',
                    message: error.message
                };
            }
        };

        /**
         * Retrieves sales order details.
         * @param {string} salesOrderId - The internal ID of the sales order.
         * @returns {Object} JSON response with sales order details.
         */
        const fetchSalesOrderDetails = (salesOrderId) => {
            try {
                let salesOrderRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: salesOrderId
                });

                let totalLines = salesOrderRecord.getLineCount({ sublistId: 'item' });
                log.debug('Total line items', totalLines);

                let lineItems = [];
                for (let i = 0; i < totalLines; i++) {
                    lineItems.push({
                        itemName: salesOrderRecord.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }),
                        quantity: salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                        rate: salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }),
                        amount: salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })
                    });
                }

                return {
                    status: "successful",
                    message: "Successfully retrieved sales order details",
                    data: lineItems
                };

            } catch (error) {
                log.error('Error retrieving sales order', error);
                return {
                    status: "failed",
                    message: "RESULT: NOT FOUND"
                };
            }
        };

        /**
         * Updates an item fulfillment record.
         * @param {number} fulfillmentId - The internal ID of the item fulfillment record.
         * @param {string} memoText - Memo value to update.
         * @returns {Object} JSON response confirming the update.
         */
        const updateItemFulfillment = (fulfillmentId, memoText) => {
            try {
                let updatedItemFulfillment = record.submitFields({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: fulfillmentId,
                    values: { memo: memoText },
                    options: { enableSourcing: true, ignoreMandatoryFields: true }
                });

                return {
                    status: "successful",
                    updatedId: updatedItemFulfillment,
                    message: "Updated fulfillment record successfully"
                };

            } catch (error) {
                log.error('Error updating fulfillment record', error);
                return {
                    status: "failed",
                    message: "RESULT: NOT FOUND"
                };
            }
        };

        /**
         * Deletes an item fulfillment record.
         * @param {number} fulfillmentId - The internal ID of the fulfillment record.
         * @returns {Object} JSON response confirming the deletion.
         */
        const deleteItemFulfillment = (fulfillmentId) => {
            try {
                record.delete({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: fulfillmentId
                });

                return {
                    status: "success",
                    message: "Deleted fulfillment record successfully"
                };

            } catch (error) {
                log.error('Error deleting fulfillment record', error);
                return {
                    status: "failed",
                    message: error.message
                };
            }
        };

        return { post, get, put, delete: doDelete };
    }
);
