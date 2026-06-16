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

// MatchChannelModel 检查 modelName 是否匹配渠道中的某个模型（考虑前缀）。
// 匹配成功返回剥离前缀后的原始模型名。
func MatchChannelModel(channel model.ModelChannel, modelName string) (string, bool) {
	prefix := channel.Prefix
	for _, m := range channel.Models {
		if prefix+m == modelName {
			return m, true
		}
	}
	return "", false
}

// BuildPrefixedModelList 构建带前缀的模型名称列表（已启用渠道）。
func BuildPrefixedModelList(channels []model.ModelChannel) []string {
	models := []string{}
	for _, channel := range channels {
		if !channel.Enabled {
			continue
		}
		for _, m := range channel.Models {
			models = append(models, channel.Prefix+m)
		}
	}
	return uniqueModelNames(models)
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
