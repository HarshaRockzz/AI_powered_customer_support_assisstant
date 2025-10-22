package handlers

import (
	"net/http"
	"strconv"

	"github.com/ai-support-assistant/backend/internal/models"
	"github.com/ai-support-assistant/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type DocumentHandler struct {
	documentService *services.DocumentService
}

func NewDocumentHandler(documentService *services.DocumentService) *DocumentHandler {
	return &DocumentHandler{documentService: documentService}
}

// HandleUploadDocument handles POST /api/docs/upload
func (h *DocumentHandler) HandleUploadDocument(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_file",
			Message: "No file provided or invalid file",
		})
		return
	}
	defer file.Close()

	uploadedBy := c.GetString("user_id")
	if uploadedBy == "" {
		uploadedBy = "anonymous"
	}

	response, err := h.documentService.UploadDocument(c.Request.Context(), file, header, uploadedBy)
	if err != nil {
		logrus.WithError(err).Error("Failed to upload document")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "upload_error",
			Message: "Failed to upload document",
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// HandleGetDocuments handles GET /api/docs
func (h *DocumentHandler) HandleGetDocuments(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	documents, err := h.documentService.GetDocuments(c.Request.Context(), limit, offset)
	if err != nil {
		logrus.WithError(err).Error("Failed to get documents")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "fetch_error",
			Message: "Failed to fetch documents",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"documents": documents,
		"count":     len(documents),
	})
}

// HandleGetDocument handles GET /api/docs/:id
func (h *DocumentHandler) HandleGetDocument(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid document ID",
		})
		return
	}

	document, err := h.documentService.GetDocumentByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "not_found",
			Message: "Document not found",
		})
		return
	}

	c.JSON(http.StatusOK, document)
}
