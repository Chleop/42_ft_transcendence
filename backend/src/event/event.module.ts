import { Module } from "@nestjs/common";
import { EventGateway } from "src/event/event.gateway";

@Module({
	providers: [EventGateway],
})
export class EventModule {}
