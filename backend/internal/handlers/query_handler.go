package handlers

import (
	"net/http"

	"github.com/ai-support-assistant/backend/internal/models"
	"github.com/ai-support-assistant/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type QueryHandler struct {
	queryService *services.QueryService
}

func NewQueryHandler(queryService *services.QueryService) *QueryHandler {
	return &QueryHandler{queryService: queryService}
}

// HandleQuery handles POST /api/query
func (h *QueryHandler) HandleQuery(c *gin.Context) {
	var req models.QueryRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_request",
			Message: err.Error(),
		})
		return
	}

	if req.Stream {
		if err := h.queryService.StreamQuery(c.Request.Context(), req, c.Writer); err != nil {
			logrus.WithError(err).Error("Failed to stream query")
		}
		return
	}

	response, err := h.queryService.ProcessQuery(c.Request.Context(), req)
	if err != nil {
		logrus.WithError(err).Error("Failed to process query")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "processing_error",
			Message: "Failed to process query. Please try again.",
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// HandleGetModels handles GET /api/models
func (h *QueryHandler) HandleGetModels(c *gin.Context) {
	result, err := h.queryService.GetModels(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to fetch models")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "processing_error",
			Message: "Failed to fetch available models.",
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
