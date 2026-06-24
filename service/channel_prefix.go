package service

import (
	"bytes"
	"encoding/json"
	"io"
	"mime"
	"mime/multipart"
	"strings"

	"github.com/basketikun/infinite-canvas/model"
)

// MatchChannelModel 检查 modelName 是否匹配渠道中的公开模型名或真实模型名。
// 匹配成功返回上游真实模型名。
func MatchChannelModel(channel model.ModelChannel, modelName string) (string, bool) {
	modelName = strings.TrimSpace(modelName)
	aliases := channelAliasMap(channel)
	for _, m := range channel.Models {
		rawModel := strings.TrimSpace(m)
		if rawModel == "" {
			continue
		}
		if aliases[rawModel] == modelName {
			return rawModel, true
		}
	}
	for _, m := range channel.Models {
		rawModel := strings.TrimSpace(m)
		if rawModel == "" {
			continue
		}
		if rawModel == modelName {
			return rawModel, true
		}
	}
	return "", false
}

// BuildPublicModelList 构建公开模型名称列表（已启用渠道）。
func BuildPublicModelList(channels []model.ModelChannel) []string {
	models := []string{}
	for _, channel := range channels {
		if !channel.Enabled {
			continue
		}
		aliases := channelAliasMap(channel)
		for _, m := range channel.Models {
			rawModel := strings.TrimSpace(m)
			if rawModel == "" {
				continue
			}
			if displayName := aliases[rawModel]; displayName != "" {
				models = append(models, displayName)
			} else {
				models = append(models, rawModel)
			}
		}
	}
	return uniqueModelNames(models)
}

func BuildPublicModelProtocols(channels []model.ModelChannel) []model.ModelProtocol {
	result := []model.ModelProtocol{}
	seen := map[string]bool{}
	for _, channel := range channels {
		if !channel.Enabled {
			continue
		}
		protocol := strings.TrimSpace(channel.Protocol)
		if protocol == "" {
			protocol = "openai"
		}
		aliases := channelAliasMap(channel)
		for _, m := range channel.Models {
			rawModel := strings.TrimSpace(m)
			if rawModel == "" {
				continue
			}
			publicModel := rawModel
			if displayName := aliases[rawModel]; displayName != "" {
				publicModel = displayName
			}
			if !seen[publicModel] {
				result = append(result, model.ModelProtocol{Model: publicModel, Protocol: protocol})
				seen[publicModel] = true
			}
		}
	}
	return result
}

// BuildDisplayModelList 保留语义别名，供调用方明确需要公开显示名列表时使用。
func BuildDisplayModelList(channels []model.ModelChannel) []string {
	return BuildPublicModelList(channels)
}

func channelAliasMap(channel model.ModelChannel) map[string]string {
	aliases := map[string]string{}
	for _, item := range channel.ModelAliases {
		rawModel := strings.TrimSpace(item.Model)
		displayName := strings.TrimSpace(item.DisplayName)
		if rawModel == "" || displayName == "" {
			continue
		}
		aliases[rawModel] = displayName
	}
	return aliases
}

// BuildPrefixedModelList 兼容旧调用，返回公开模型名称列表。
func BuildPrefixedModelList(channels []model.ModelChannel) []string {
	return BuildPublicModelList(channels)
}

func hasAliasForModel(aliases []model.ModelAlias, rawModel string) bool {
	rawModel = strings.TrimSpace(rawModel)
	for _, item := range aliases {
		if strings.TrimSpace(item.Model) == rawModel && strings.TrimSpace(item.DisplayName) != "" {
			return true
		}
	}
	return false
}

func normalizeModelAliases(channel model.ModelChannel) []model.ModelAlias {
	result := []model.ModelAlias{}
	for _, item := range channel.ModelAliases {
		rawModel := strings.TrimSpace(item.Model)
		displayName := strings.TrimSpace(item.DisplayName)
		if rawModel == "" || displayName == "" {
			continue
		}
		result = append(result, model.ModelAlias{Model: rawModel, DisplayName: displayName})
	}
	if strings.TrimSpace(channel.Prefix) != "" {
		for _, m := range channel.Models {
			rawModel := strings.TrimSpace(m)
			if rawModel == "" || hasAliasForModel(result, rawModel) {
				continue
			}
			result = append(result, model.ModelAlias{Model: rawModel, DisplayName: strings.TrimSpace(channel.Prefix) + rawModel})
		}
	}
	return uniqueModelAliases(result)
}

func uniqueModelAliases(aliases []model.ModelAlias) []model.ModelAlias {
	result := []model.ModelAlias{}
	seen := map[string]bool{}
	for _, item := range aliases {
		rawModel := strings.TrimSpace(item.Model)
		displayName := strings.TrimSpace(item.DisplayName)
		if rawModel == "" || displayName == "" || seen[rawModel] {
			continue
		}
		seen[rawModel] = true
		result = append(result, model.ModelAlias{Model: rawModel, DisplayName: displayName})
	}
	return result
}

// ReplaceModelInBody 替换请求体中的 model 字段。
func ReplaceModelInBody(body []byte, contentType string, oldModel, newModel string) []byte {
	if oldModel == newModel {
		return body
	}
	if strings.HasPrefix(contentType, "multipart/form-data") {
		return replaceMultipartModel(body, contentType, newModel)
	}
	return replaceJSONModel(body, newModel)
}

func replaceJSONModel(body []byte, newModel string) []byte {
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		return body
	}
	payload["model"] = newModel
	result, err := json.Marshal(payload)
	if err != nil {
		return body
	}
	return result
}

func replaceMultipartModel(body []byte, contentType string, newModel string) []byte {
	_, params, err := mime.ParseMediaType(contentType)
	if err != nil {
		return body
	}
	boundary := params["boundary"]
	if boundary == "" {
		return body
	}
	reader := multipart.NewReader(bytes.NewReader(body), boundary)
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	writer.SetBoundary(boundary)
	for {
		part, err := reader.NextPart()
		if err != nil {
			break
		}
		fieldName := part.FormName()
		partData, _ := io.ReadAll(part)
		if fieldName == "model" {
			_ = writer.WriteField("model", newModel)
		} else {
			if part.FileName() != "" {
				pw, _ := writer.CreatePart(part.Header)
				_, _ = pw.Write(partData)
			} else {
				_ = writer.WriteField(fieldName, string(partData))
			}
		}
	}
	writer.Close()
	return buf.Bytes()
}
