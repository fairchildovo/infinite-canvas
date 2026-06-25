package router

import (
	"github.com/basketikun/infinite-canvas/handler"
	"github.com/basketikun/infinite-canvas/middleware"
	"github.com/gin-gonic/gin"
)

func registerTicketRoutes(api *gin.RouterGroup, admin *gin.RouterGroup) {
	// 用户端。
	api.POST("/tickets", middleware.UserAuth, gin.WrapF(handler.CreateTicket))
	api.GET("/tickets", middleware.UserAuth, gin.WrapF(handler.ListMyTickets))
	api.GET("/tickets/:id", middleware.UserAuth, func(c *gin.Context) {
		handler.GetTicket(c.Writer, c.Request, c.Param("id"))
	})
	api.POST("/tickets/:id/replies", middleware.UserAuth, func(c *gin.Context) {
		handler.AddTicketReply(c.Writer, c.Request, c.Param("id"))
	})
	// 管理端。
	admin.GET("/tickets", gin.WrapF(handler.AdminTickets))
	admin.GET("/tickets/:id", func(c *gin.Context) {
		handler.AdminGetTicket(c.Writer, c.Request, c.Param("id"))
	})
	admin.POST("/tickets/:id/replies", func(c *gin.Context) {
		handler.AdminAddTicketReply(c.Writer, c.Request, c.Param("id"))
	})
	admin.PUT("/tickets/:id/status", func(c *gin.Context) {
		handler.AdminUpdateTicketStatus(c.Writer, c.Request, c.Param("id"))
	})
	admin.PUT("/tickets/:id/assign", func(c *gin.Context) {
		handler.AdminAssignTicket(c.Writer, c.Request, c.Param("id"))
	})
}
