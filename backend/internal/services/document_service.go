package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/ai-support-assistant/backend/internal/config"
	"github.com/ai-support-assistant/backend/internal/db"
	"github.com/ai-support-assistant/backend/internal/models"
	"github.com/sirupsen/logrus"
)

type DocumentService struct {
	cfg *config.Config
}

func NewDocumentService(cfg *config.Config) *DocumentService {
	return &DocumentService{cfg: cfg}
}

// UploadDocument handles document upload and sends to RAG service
func (s *DocumentService) UploadDocument(ctx context.Context, file multipart.File, header *multipart.FileHeader, uploadedBy string) (*models.DocumentUploadResponse, error) {
	// Save document metadata to database
	doc := models.Document{
		FileName:   header.Filename,
		FileType:   header.Header.Get("Content-Type"),
		FileSize:   header.Size,
		Status:     "processing",
		UploadedBy: uploadedBy,
	}

	if err := db.DB.Create(&doc).Error; err != nil {
		return nil, fmt.Errorf("failed to save document: %w", err)
	}

	// Send to RAG service for ingestion
	go s.ingestDocument(doc.ID, file, header)

	return &models.DocumentUploadResponse{
		DocumentID: doc.ID,
		FileName:   header.Filename,
		Status:     "processing",
		Message:    "Document uploaded successfully and is being processed",
	}, nil
}

// ingestDocument sends document to RAG service for ingestion
func (s *DocumentService) ingestDocument(docID uint, file multipart.File, header *multipart.FileHeader) {
	ctx := context.Background()

	// Reset file pointer
	file.Seek(0, 0)

	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		s.updateDocumentStatus(docID, "failed")
		logrus.WithError(err).Error("Failed to create form file")
		return
	}

	if _, err := io.Copy(part, file); err != nil {
		s.updateDocumentStatus(docID, "failed")
		logrus.WithError(err).Error("Failed to copy file")
		return
	}

	writer.Close()

	// Make request to RAG service
	url := fmt.Sprintf("%s/rag/ingest", s.cfg.RAGServiceURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, body)
	if err != nil {
		s.updateDocumentStatus(docID, "failed")
		logrus.WithError(err).Error("Failed to create request")
		return
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{
		Timeout: 300 * time.Second, // 5 minutes for large files
	}

	resp, err := client.Do(req)
	if err != nil {
		s.updateDocumentStatus(docID, "failed")
		logrus.WithError(err).Error("Failed to call RAG service")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		s.updateDocumentStatus(docID, "failed")
		bodyBytes, _ := io.ReadAll(resp.Body)
		logrus.WithField("status", resp.StatusCode).WithField("body", string(bodyBytes)).Error("RAG service returned error")
		return
	}

	// Parse response
	var ingestResp struct {
		ChunkCount    int    `json:"chunk_count"`
		VectorStoreID string `json:"vector_store_id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&ingestResp); err != nil {
		s.updateDocumentStatus(docID, "failed")
		logrus.WithError(err).Error("Failed to decode response")
		return
	}

	// Update document status
	db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
		"status":          "completed",
		"chunk_count":     ingestResp.ChunkCount,
		"vector_store_id": ingestResp.VectorStoreID,
	})

	logrus.WithFields(logrus.Fields{
		"doc_id":      docID,
		"chunk_count": ingestResp.ChunkCount,
	}).Info("Document ingested successfully")
}

// updateDocumentStatus updates document status
func (s *DocumentService) updateDocumentStatus(docID uint, status string) {
	db.DB.Model(&models.Document{}).Where("id = ?", docID).Update("status", status)
}

// GetDocuments returns list of documents
func (s *DocumentService) GetDocuments(ctx context.Context, limit int, offset int) ([]models.Document, error) {
	var documents []models.Document

	if err := db.DB.Order("created_at DESC").Limit(limit).Offset(offset).Find(&documents).Error; err != nil {
		return nil, fmt.Errorf("failed to get documents: %w", err)
	}

	return documents, nil
}

// GetDocumentByID returns a document by ID
func (s *DocumentService) GetDocumentByID(ctx context.Context, id uint) (*models.Document, error) {
	var document models.Document

	if err := db.DB.First(&document, id).Error; err != nil {
		return nil, fmt.Errorf("document not found: %w", err)
	}

	return &document, nil
}
